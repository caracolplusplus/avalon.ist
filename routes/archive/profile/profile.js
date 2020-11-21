const EmailTree = require('../../routes/parse/email-tree');

// eslint-disable-next-line no-undef
class User extends Parse.User {
  constructor(attributes) {
    super(attributes);

    this.avatarClassic = {
      spy: 'https://i.ibb.co/cNkZrBK/base-spy-c.png',
      res: 'https://i.ibb.co/Xzpqy65/base-res-c.png',
    };
    this.avatarGummy = {
      spy: 'https://i.ibb.co/sJcthnM/base-spy.png',
      res: 'https://i.ibb.co/M8RXC95/base-res.png',
    };
    this.bio = 'A very mysterious person.';
    this.nationality = 'United Nations';

    this.games = [0, 0];
    this.gameStats = {
      merlin: [0, 0],
      percival: [0, 0],
      resistance: [0, 0],
      assassin: [0, 0],
      morgana: [0, 0],
      oberon: [0, 0],
      mordred: [0, 0],
      spy: [0, 0],
    };
    this.gameHistory = [];
    this.gameShots = [0, 0];
    this.gameRating = 1500;

    this.playArea = 1;
    this.playTabs = 2;
    this.playFontSize = 12;
    this.avatarSize = 75;
    this.avatarStyle = true;
    this.themeLight = false;
    this.coloredNames = true;

    this.isAdmin = false;
    this.isMod = false;
    this.isContrib = false;

    this.isBanned = false;
    this.suspensionDate = 0;
    this.ips = [];

    this.tauntCooldown = Date.now();
    this.messageCooldown = [0];

    this.validUser = false;
  }

  validateLoginData() {
    if (this.get('validUser')) return;

    const usernameRegex = /^[0-9a-zA-Z\-_.]{3,15}$/;
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;

    const username = this.get('username');
    const email = this.get('email');
    const domain = email.split('@')[1];

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

    if (!EmailTree.test(domain)) {
      throw new Error(errors['domain']);
    }

    this.set('validUser', true);

    return true;
  }

  addGameToProfile(data) {
    const { code, role, res, cause, winner } = data;

    const gameHistory = this.get('gameHistory');
    const games = this.get('games');
    const gameStats = this.get('gameStats');
    const gameShots = this.get('gameShots');

    gameHistory.push(code);

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

    this.set('gameHistory', gameHistory);
    this.set('games', games);
    this.set('gameStats', gameStats);
    this.set('gameShots', gameShots);

    return this;
  }
}

// eslint-disable-next-line no-undef
Parse.Object.registerSubclass('_User', User);
