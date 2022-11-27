/* global Parse */
const Environment = require('./environment');
const ipTree = require('../security/trees/ip-tree');
// const emailTree = require('../security/trees/email-tree');

Parse.User.allowCustomUserClass(true);

class User extends Parse.User {
  constructor(attributes) {
    super(attributes);
  }

  setValid(onLockdown) {
    this.set('avatars', {
      spy: 'https://i.ibb.co/sJcthnM/base-spy.png',
      res: 'https://i.ibb.co/M8RXC95/base-res.png',
    });
    this.set('bio', 'A very mysterious person.');
    this.set('nationality', 'United Nations');

    this.set('games', [0, 0]);
    this.set('gameStats', {
      merlin: [0, 0],
      percival: [0, 0],
      resistance: [0, 0],
      assassin: [0, 0],
      morgana: [0, 0],
      oberon: [0, 0],
      mordred: [0, 0],
      spy: [0, 0],
    });
    this.set('gameHistory', []);
    this.set('gameShots', [0, 0]);
    this.set('gameRating', 1500);

    this.set('playArea', 1);
    this.set('playTabs', 2);
    this.set('playFontSize', 12);
    this.set('avatarSize', 75);
    this.set('avatarStyle', true);
    this.set('themeLight', false);
    this.set('coloredNames', true);
    this.set('numberOfMessages', 20);

    this.set('lockedOut', onLockdown);

    this.set('isAdmin', false);
    this.set('isMod', false);
    this.set('isContrib', false);

    this.set('isOnline', false);
    this.set('instanceCount', 0);

    this.set('isBanned', false);
    this.set('suspensionDate', 0);
    this.set('addressList', []);

    this.set('tauntCooldown', Date.now());
    this.set('messageCooldown', [0]);

    this.set('validUser', true);
  }
  /**Called to validate user login data
   * @param  {} data
   */
  validateLoginData(data) {
    const { onLockdown } = data;

    if (this.has('validUser')) return;

    const usernameRegex = /^[0-9a-zA-Z\-_.]{3,15}$/;
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]+$/;

    const username = this.get('username');
    const email = this.get('email');
    /* const domain = email.split('@')[1]; */

    const errors = {
      username: `Username must have 3 to 15 characters. 
     The characters must be part of the english alphabet, be digits from 0 to 9, or characters ., _ and -.`,
      email: `Email must be in a valid email format.`,
      domain: `Email address is not from a trusted service.
    Make sure to not use disposable email accounts.`,
    };

    if (!usernameRegex.test(username)) {
      throw new Error(errors['username']);
    }

    if (!emailRegex.test(email)) {
      throw new Error(errors['email']);
    }

    /* if (!emailTree.testEmail(domain)) {
      throw new Error(errors['domain']);
    } */

    this.setValid(onLockdown);

    return true;
  }
  /**Async method called to check if user has been banned, suspended or is connecting
   * from blacklisted ip address.
   * @param  {} data -ip address, skip (control variable)
   */
  async checkForBans(data) {
    const environment = await Environment.getGlobal();

    const { address, skip } = data;

    const isMod = this.get('isMod') || this.get('isAdmin');
    const suspensionDate = this.get('suspensionDate');
    const currentDate = Date.now();

    if (isMod) return false;

    const banned = this.get('isBanned');
    const suspended = suspensionDate > currentDate;
    const maintenance = environment.get('onMaintenance');
    const ipBanned = ipTree.testIp(address);

    const errors = {
      banned: `Access denied, your account has been permanently banned.`,
      suspended: `Access denied, your account has been temporarily suspended until:  ${new Date(
        suspensionDate
      ).toUTCString()}`,
      maintenance: 'Access denied, the server is currently on maintenance',
      blacklisted: `Access denied, you are trying to access the site from a blacklisted IP adress. 
    Contact the moderation team if you think this is a mistake.`,
    };

    if (banned) {
      throw new Error(errors['banned']);
    }

    if (suspended) {
      throw new Error(errors['suspended']);
    }

    if (maintenance) {
      throw new Error(errors['maintenance']);
    }

    if (ipBanned) {
      throw new Error(errors['blacklisted']);
    }

    if (!skip) {
      this.setACL(new Parse.ACL(this));
      this.addUnique('addressList', address);
      this.save({}, { useMasterKey: true });
    }

    return true;
  }
  /**Change online status to online
   * @param  {} data
   */
  joinPresence(data) {
    this.set('isOnline', true);

    this.save({}, { useMasterKey: true, context: { presence: true } });

    return true;
  }
  /**Change online status to offline
   * @param  {} data
   */
  leavePresence(data) {
    this.set('isOnline', false);

    this.save({}, { useMasterKey: true, context: { presence: true } });

    return true;
  }
  /**Change lock status
   */
  toggleLock() {
    this.set('lockedOut', false);

    this.save({}, { useMasterKey: true });

    return true;
  }
  /**Change ban status
   * @param  {} data - true/false
   */
  toggleBan(data) {
    this.set('isBanned', data);

    this.save({}, { useMasterKey: true, context: { kick: data } });

    return true;
  }
  /**Called to block player for a set amount of time
   * @param  {} data - amount of time to lock user (in hours)
   */
  setSuspension(data) {
    let { hours } = data;

    hours = parseFloat(hours);
    hours = isNaN(hours) ? 1 : hours;

    this.set('suspensionDate', Date.now() + hours * 3600000);

    this.save({}, { useMasterKey: true, context: { kick: true } });

    return hours;
  }
  /**Called to remove suspension status
   */
  revokeSuspension() {
    this.set('suspensionDate', Date.now());

    this.save({}, { useMasterKey: true });

    return true;
  }
  /**Called to set profile data for a user
   * @param  {} data - data to be set
   */
  setProfile(data) {
    const { bio, nationality } = data;

    this.set('bio', bio);
    this.set('nationality', nationality);

    this.save({}, { useMasterKey: true });

    return true;
  }
  /**Called to set avator for a user
   * @param  {} data - avatar to be set
   */
  setAvatars(data) {
    this.set('avatars', data);

    this.save({}, { useMasterKey: true });

    return true;
  }
  /**Called to set the stage up
   * @param  {} data - neccessery info (look below)
   */
  setTheme(data) {
    const {
      playArea,
      playTabs,
      playFontSize,
      avatarSize,
      avatarStyle,
      themeLight,
      coloredNames,
      numberOfMessages,
    } = data;

    this.set('playArea', playArea);
    this.set('playTabs', playTabs);
    this.set('playFontSize', playFontSize);
    this.set('avatarSize', avatarSize);
    this.set('avatarStyle', avatarStyle);
    this.set('themeLight', themeLight);
    this.set('coloredNames', coloredNames);
    this.set('numberOfMessages', numberOfMessages);

    this.save({}, { useMasterKey: true });

    return true;
  }
  /**Add game sesion to user profile. Update user game history, increase numbers of
   * games played and selected roles.
   * @param  {} data - neccessery data
   */
  addGameToProfile(data) {
    const { code, role, winner, cause, date, size, id } = data;

    console.log(this.get('username'), data);

    const res = ['resistance', 'percival', 'merlin'].includes(role) ? 1 : 0;

    const games = this.get('games');
    const gameStats = this.get('gameStats');
    const gameShots = this.get('gameShots');

    this.addUnique('gameHistory', {
      code,
      id,
      role: role.charAt(0).toUpperCase() + role.slice(1),
      size,
      date,
      winner,
    });

    games[1]++;
    gameStats[role][1]++;

    if (winner === res) {
      games[0]++;
      gameStats[role][0]++;
    }

    if (cause < 2 && role === 'assassin') {
      gameShots[1]++;

      if (cause < 1) gameShots[0]++;
    }

    this.set('games', games);
    this.set('gameStats', gameStats);
    this.set('gameShots', gameShots);

    this.save({}, { useMasterKey: true });

    return true;
  }

  addTaunt() {
    this.set('tauntCooldown', Date.now() + 15000);

    this.save({}, { useMasterKey: true });

    return true;
  }
  /**Called to generate user profile page
   */
  toProfilePage() {
    const client = {};

    const parameters = [
      'username',
      'avatars',
      'bio',
      'nationality',
      'games',
      'gameStats',
      'gameHistory',
      'gameShots',
      'gameRating',
    ];

    for (const x in parameters) {
      const y = parameters[x];

      client[y] = this.get(y);
    }

    return client;
  }
  /**Called to generate current player list
   */
  toPlayerList() {
    const client = {};

    const parameters = ['username', 'isMod', 'isAdmin', 'isContrib', 'gameRating'];

    for (const x in parameters) {
      const y = parameters[x];

      client[y] = this.get(y);
    }

    return client;
  }
  /**Called to generate stage
   */
  toStyle() {
    const client = {};

    const parameters = [
      'playArea',
      'playTabs',
      'playFontSize',
      'avatarSize',
      'avatarStyle',
      'themeLight',
      'coloredNames',
      'numberOfMessages',
    ];

    for (const x in parameters) {
      const y = parameters[x];

      client[y] = this.get(y);
    }

    return client;
  }
}

Parse.Object.registerSubclass('_User', User);

module.exports = User;
