class Profile {
  constructor(id) {
    // User
    this.user = id;
    // Personality
    this.avatarClassic = {
      spy: 'https://i.ibb.co/cNkZrBK/base-spy-c.png',
      res: 'https://i.ibb.co/Xzpqy65/base-res-c.png',
    };
    this.avatarGummy = {
      spy: 'https://i.ibb.co/sJcthnM/base-spy.png',
      res: 'https://i.ibb.co/M8RXC95/base-res.png',
    };
    this.bio = 'This is my account on Avalon.ist.';
    this.nationality = 'United Nations';
    // Game
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
    // Moderation
    this.isBanned = false;
    this.suspensionDate = 0;
    this.ips = [];
  }

  async saveToUser() {
    const query = new Parse.Query('_User');
    query.equalTo('username', this.user);

    return await query
      .first({
        useMasterKey: true,
      })
      .then((user) => {
        if (user) {
          this.writeUser(user);
          return this;
        }

        return undefined;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  writeUser(user) {
    for (let x in this) {
      if (['user', 'ips'].includes(x)) continue;

      user.set(x, this[x]);
    }

    user.save({}, { useMasterKey: true });
  }

  async getFromUser() {
    const query = new Parse.Query('_User');
    query.equalTo('username', this.user);

    return await query
      .first({
        useMasterKey: true,
      })
      .then((user) => {
        if (user) {
          this.readUser(user);

          return this;
        }

        return undefined;
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

  addGameToProfile(data) {
    this.gameHistory.push(data.code);

    this.games[1]++;
    this.gameStats[data.role][1]++;

    if (data.winner === data.res) {
      this.games[0]++;
      this.gameStats[data.role][0]++;
    }

    if (data.cause < 2 && data.role === 'assassin') {
      this.gameShots[1]++;

      if (data.cause < 1) this.gameShots[0]++;
    }
  }
}

module.exports = Profile;
