/* global Parse, Set */
const Chat = require('./chat');
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
    const chat = Chat.spawn({ code: 'Global' });

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
      .then(async (g) => {
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

  checkOnlinePlayers(data) {
    const { user } = data;

    const userQ = new Parse.Query('_User');
    userQ.equalTo('isOnline', true);

    const moderatorList = [];

    userQ
      .find({
        useMasterKey: true,
      })
      .then((userList) => {
        let appears = -1;
        const username = user.get('username');

        const playerList = userList.map((u, i) => {
          const client = u.toPlayerList();
          if (client.username === username) appears = i;
          if (client.isMod || client.isAdmin) moderatorList.push(client.username);

          return client;
        });

        if (user.get('isOnline')) {
          if (appears <= -1) playerList.push(user.toPlayerList());
        } else {
          if (appears > -1) playerList.splice(appears, 1);
        }

        this.set('playerList', playerList);
        this.set('moderatorList', moderatorList);

        this.save({}, { useMasterKey: true, context: { playerList: true } });
      })
      .catch((err) => console.log(err));

    return true;
  }

  checkActiveGames() {
    const gameQ = new Parse.Query('Game');
    gameQ.equalTo('active', true);
    gameQ.equalTo('listed', true);

    gameQ
      .find({
        useMasterKey: true,
      })
      .then((gameList) => {
        const roomList = gameList.map((g) => g.toRoomList());

        this.set('roomList', roomList);

        this.save({}, { useMasterKey: true, context: { roomList: true } });
      })
      .catch((err) => console.log(err));

    return true;
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

  async addAnnouncement(data) {
    const announcementLogs = this.get('announcementLogs');

    announcementLogs.push({
      id: 'untitled',
      title: 'Untitled Article',
      author: 'Anonymous',
      timestamp: Date.now(),
      content: 'There is nothing in this article',
      ...data,
    });

    this.set('announcementLogs', announcementLogs);

    await this.save({}, { useMasterKey: true });

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
