class Profile {
  constructor(id) {
    // User
    this.user = id;
    // Personality
    this.avatarClassic = {
      spy: 'to_define',
      res: 'to_define',
    };
    this.avatarGummy = {
      spy: 'to_define',
      res: 'to_define',
    };
    this.bio = 'This is my account on Avalon.ist.';
    this.nationality = 'United Nations';
    // Game
    this.games = 0;
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
    // Customizing
    this.playArea = 0;
    this.playTabs = 2;
    this.playFontSize = 14;
    this.avatarSize = 140;
    this.avatarStyle = true;
    this.themeLight = false;
    // Roles
    this.isAdmin = false;
    this.isMod = false;
    this.isContrib = false;
  }

  async saveToUser() {
    const query = new Parse.Query('_User');
    query.equalTo('username', this.user);

    await query
      .first({
        useMasterKey: true,
      })
      .then((user) => {
        if (user) this.writeUser(user);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  writeUser(user) {
    for (let x in this) {
      if (x === 'user') continue;

      user.set(x, this[x]);
    }

    user.save({}, { useMasterKey: true });
  }

  async getFromUser() {
    const query = new Parse.Query('_User');
    query.equalTo('username', this.user);

    await query
      .first({
        useMasterKey: true,
      })
      .then((user) => {
        if (user) this.readUser(user);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  readUser(user) {
    for (let x in this) {
      if (x === 'user') continue;

      const got = user.get(x);

      if (got !== undefined) {
        if (['avatarClassic', 'avatarGummy', 'gameStats'].includes(x)) {
          this[x] = {
            ...this[x],
            ...got,
          };
        } else {
          this[x] = got;
        }
      }
    }
  }
}

module.exports = Profile;
