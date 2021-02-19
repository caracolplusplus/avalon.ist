/* global Parse*/

const ipTree = require('../security/trees/ip-tree');
const emailTree = require('../security/trees/email-tree');
const discordReports = require('../security/discordReports');

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

        Environment.updateTrees(g);

        Environment.setGlobal(g).then(() => {
          g.setDiscordHook();
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static async setGlobal(g) {
    await g.save({}, { useMasterKey: true });
  }

  static async getGlobal() {
    const envQ = new Parse.Query('Environment');

    return await envQ.first({ useMasterKey: true });
  }

  static async checkOnlinePlayers(data) {
    const userQ = new Parse.Query('_User');
    userQ.equalTo('isOnline', true);
    userQ.limit(500);

    const listsQ = new Parse.Query('Lists');

    const lists = await listsQ.first({ useMasterKey: true });
    const playerList = await userQ.find({ useMasterKey: true });

    const moderatorList = [];
    const playerListMap = playerList.map((p) => {
      if (p.get('isMod') || p.get('isAdmin')) moderatorList.push(p.get('username'));

      return p.toPlayerList();
    });

    lists.set('playerList', playerListMap);
    lists.set('moderatorList', moderatorList);

    lists.save({}, { useMasterKey: true });

    return true;
  }

  static async checkActiveGames(data) {
    const gameQ = new Parse.Query('Game');
    gameQ.equalTo('active', true);
    gameQ.equalTo('listed', true);
    gameQ.limit(50);

    const listsQ = new Parse.Query('Lists');

    const lists = await listsQ.first({ useMasterKey: true });
    const roomList = await gameQ.find({ useMasterKey: true });

    const roomListMap = roomList.map((r) => r.toRoomList());

    lists.set('roomList', roomListMap);

    lists.save({}, { useMasterKey: true });

    return true;
  }

  static updateTrees(env) {
    const ipBlacklist = env.get('ipBlacklist');
    const emailWhitelist = env.get('emailWhitelist');

    ipTree.setTree(ipBlacklist);
    emailTree.setTree(emailWhitelist);

    return true;
  }

  static async toggleIps(data) {
    const env = await Environment.getGlobal();

    const { ips, add } = data;

    ips.forEach((e) => {
      if (add) {
        env.addUnique('ipBlacklist', e);
      } else {
        env.remove('ipBlacklist', e);
      }
    });

    env.save({}, { useMasterKey: true, context: { kick: add, ips } });

    return true;
  }

  static async toggleEmails(data) {
    const env = await Environment.getGlobal();

    const { emails, add } = data;

    emails.forEach((e) => {
      if (add) {
        env.addUnique('emailWhitelist', e);
      } else {
        env.remove('emailWhitelist', e);
      }
    });

    env.save({}, { useMasterKey: true });

    return true;
  }

  static addAvatarLog(data) {
    const Avatar = Parse.Object.extend('Avatar');

    const e = new Avatar();

    const ACL = new Parse.ACL();
    ACL.setPublicReadAccess(true);
    ACL.setPublicWriteAccess(false);

    e.setACL(ACL);

    e.set('user', data.target);
    e.set('avatar', data.res);
    e.set('timestamp', Date.now());

    e.save({}, { useMasterKey: true });

    return true;
  }

  static async addAnnouncement(data) {
    const annQ = new Parse.Query('Announcement');
    annQ.equalTo('url', data.id);

    const Announcement = Parse.Object.extend('Announcement');

    const e = (await annQ.first({ useMasterKey: true })) || new Announcement();

    const ACL = new Parse.ACL();
    ACL.setPublicReadAccess(true);
    ACL.setPublicWriteAccess(false);

    e.setACL(ACL);

    e.set('url', data.id);
    e.set('title', data.title);
    e.set('author', data.author);
    e.set('content', data.content);
    e.set('timestamp', Date.now());

    e.save({}, { useMasterKey: true });

    return true;
  }

  static addModerationLog(data) {
    const Logs = Parse.Object.extend('Logs');

    const e = new Logs();

    e.set('action', data.action);
    e.set('from', data.from);
    e.set('to', data.to);
    e.set('comment', data.comment || 'No comment.');
    e.set('info', data.info || {});
    e.set('duration', data.duration || 0);
    e.set('timestamp', Date.now());

    e.save({}, { useMasterKey: true });

    return true;
  }

  static addErrorLog(data) {
    const Err = Parse.Object.extend('Error');

    const e = new Err();

    e.set('message', data.message);
    e.set('stack', data.stack);
    e.set('timestamp', Date.now());

    e.save({}, { useMasterKey: true });

    discordReports.newError(data);

    return true;
  }

  toggleMaintenance() {
    const onMaintenance = this.get('onMaintenance');

    this.set('onMaintenance', !onMaintenance);

    this.save({}, { useMasterKey: true, context: { global: true } });

    return true;
  }

  toggleLockdown() {
    const onLockdown = this.get('onLockdown');

    this.set('onLockdown', !onLockdown);

    this.save({}, { useMasterKey: true });

    return !onLockdown;
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
}

Parse.Object.registerSubclass('Environment', Environment);

module.exports = Environment;
