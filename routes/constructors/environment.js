/* global Parse, Set */

const ipTree = require('../security/trees/ip-tree');
const emailTree = require('../security/trees/email-tree');
const discordReports = require('../security/discordReports');

let globalEnvironment = null;

class Environment extends Parse.Object {
  constructor() {
    super('Environment');
  }

  static spawn() {
    const env = new Environment();
    const chat = require('./chat').spawn({ code: 'Global' });

    env.set('code', 'Global');
    env.set('games', 1);

    env.set('onMaintenance', false);

    env.set('discordWebhookURL', '/');

    env.set('ipBlacklist', require('../security/databases/untrusted-ips'));
    env.set('emailWhitelist', require('../security/databases/trusted-emails'));

    env.set('avatarLogs', []);
    env.set('announcementLogs', []);
    env.set('moderationLogs', []);
    env.set('errorLogs', []);

    env.set('playerList', []);
    env.set('roomList', []);

    env.set('chat', chat);

    return env;
  }

  static initialize() {
    const envQ = new Parse.Query('Environment');
    envQ.equalTo('code', 'Global');

    envQ
      .first({
        useMasterKey: true,
      })
      .then((g) => {
        if (!g) {
          g = Environment.spawn();
        }

        g.setDiscordHook();

        g.updateTrees();

        g.addModerationLog({
          action: 'ENVIRONMENT STARTED',
          from: 'Avalon.ist',
          to: 'Avalon.ist',
        });

        Environment.setGlobal(g);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static setGlobal(g) {
    globalEnvironment = g;
  }

  static getGlobal() {
    return globalEnvironment;
  }

  setDiscordHook() {
    discordReports.newHook(this.get('discordWebhookURL'));
  }

  validateSignupData(data) {
    const { address } = data;

    const errors = {
      blacklisted: `Access denied.
		 You are trying to access the site from a blacklisted IP adress. 
		 Contact the moderation team if you think this is a mistake.`,
      maintenance: `Access denied.
		 The server is currently on maintenance.`,
    };

    const maintenance = this.get('onMaintenance');
    const blacklisted = ipTree.testIp(address);

    if (blacklisted) {
      throw new Error(errors['blacklisted']);
    }

    if (maintenance) {
      throw new Error(errors['maintenance']);
    }

    return true;
  }

  testFunction() {
    console.log('This a test message!');
  }

  async checkOnlinePlayers(data) {
    const { user } = data;

    const username = user.get('username');
    const hasPower = user.get('isMod') || user.get('isAdmin');

    if (user.get('isOnline')) {
      if (hasPower) this.addUnique('moderatorList', username);
      this.addUnique('playerList', user);
    } else {
      if (hasPower) this.remove('moderatorList', username);
      this.remove('playerList', user);
    }

    this.save({}, { useMasterKey: true, context: { playerList: true } });

    return true;
  }

  async checkActiveGames(data) {
    const { game, beforeSave } = data;

    if (!game.id) return;

    const relation = this.get('roomListNew') || this.relation('roomListNew');

    if (game.get('active') && game.get('listed') && beforeSave) {
      relation.add(game);
    } else {
      relation.remove(game);
    }

    this.save({}, { useMasterKey: true, context: { roomList: true } });

    return true;
  }

  getOnlinePlayers(callback) {
    const playerQ = this.get('playerList');

    Parse.Object.fetchAll(playerQ, { useMasterKey: true })
      .then((playerList) => {
        const map = playerList.map((p) => p.toPlayerList());

        callback(map);
      })
      .catch((err) => console.log(err));
  }

  getActiveGames(callback) {
    const gameQ = this.get('roomListNew').query();

    gameQ
      .find({ useMasterKey: true })
      .then((roomList) => {
        const map = roomList.map((r) => r.toRoomList());

        callback(map);
      })
      .catch((err) => console.log(err));
  }

  updateTrees() {
    const ipBlacklist = this.get('ipBlacklist');
    const emailWhitelist = this.get('emailWhitelist');

    ipTree.setTree(ipBlacklist);
    emailTree.setTree(emailWhitelist);

    return true;
  }

  toggleIps(data) {
    const { ips, add } = data;

    const ipBlacklist = this.get('ipBlacklist');

    const set = new Set(ipBlacklist);

    ips.forEach((e) => {
      if (add) {
        set.add(e);
      } else {
        set.delete(e);
      }
    });

    this.set('ipBlacklist', [...set]);

    this.save({}, { useMasterKey: true, context: { kick: add, ips } });

    return true;
  }

  toggleEmails(data) {
    const { emails, add } = data;

    const emailWhitelist = this.get('emailWhitelist');

    const set = new Set(emailWhitelist);

    emails.forEach((e) => {
      if (add) {
        set.add(e);
      } else {
        set.delete(e);
      }
    });

    this.set('emailWhitelist', [...set]);

    this.save({}, { useMasterKey: true });

    return true;
  }

  toggleMaintenance() {
    const onMaintenance = this.get('onMaintenance');

    this.set('onMaintenance', !onMaintenance);

    this.save({}, { useMasterKey: true });

    return true;
  }

  toggleLockdown() {
    const onLockdown = this.get('onLockdown') || false;

    this.set('onLockdown', !onLockdown);

    this.save({}, { useMasterKey: true });

    return !onLockdown;
  }

  addAvatarLog(data) {
    const avatarLogs = this.get('avatarLogs');

    avatarLogs.push({
      user: data.user,
      avatar: data.res,
      timestamp: Date.now(),
    });

    this.set('avatarLogs', avatarLogs);

    this.save({}, { useMasterKey: true });

    return true;
  }

  addAnnouncement(data) {
    this.addUnique('announcementLogs', {
      id: 'untitled',
      title: 'Untitled Article',
      author: 'Anonymous',
      timestamp: Date.now(),
      content: 'There is nothing in this article',
      ...data,
    });

    this.save({}, { useMasterKey: true });

    return true;
  }

  addModerationLog(data) {
    const moderationLogs = this.get('moderationLogs');

    moderationLogs.push({
      action: 'NO ACTION',
      from: 'Anonymous',
      to: 'Anonymous',
      comment: 'No comment',
      info: {},
      duration: NaN,
      timestamp: Date.now(),
      ...data,
    });

    this.set('moderationLogs', moderationLogs);

    this.save({}, { useMasterKey: true });

    return true;
  }

  addErrorLog(data) {
    const errorLogs = this.get('errorLogs') || [];

    errorLogs.push({
      message: 'No message',
      stack: 'No stack',
      timestamp: Date.now(),
      ...data,
    });

    discordReports.newError(data);

    this.set('errorLogs', errorLogs);

    this.save({}, { useMasterKey: true });

    return true;
  }
}

Parse.Object.registerSubclass('Environment', Environment);

module.exports = Environment;
