class Game {
  constructor(roomname, players, roles, maxPlayers) {
    // Creates a Game Object
    this.roomName = roomname;
    this.host = '';
    // Players and Roles
    this.players = players;
    this.clients = {};
    this.kickedPlayers = new Set();
    this.roles = roles;
    this.roleSettings = {
      // Res
      merlin: true,
      percival: true,
      // Spy
      morgana: true,
      assassin: true,
      oberon: false,
      mordred: false,
      // Card
      card: false,
    };
    this.maxPlayers = maxPlayers;
    // Knowledge
    this.publicKnowledge = new Array(10).fill('Resistance?');
    this.privateKnowledge = {};
    // Started
    this.started = false;
  }

  deserialize(input) {
    for (const x in input) {
      Reflect.set(this, x, Reflect.get(input, x));
    }
    return this;
  }

  // Sets Roles according to given settings
  setRolesOnGame(settings, maxPlayers) {
    this.roleSettings = settings;

    let playersLength = this.players.length;

    this.maxPlayers = Math.min(Math.max(playersLength, maxPlayers, 5), 10);

    let resTeamLength = Math.ceil(playersLength / 2 + 0.1);
    const spyTeamLength = resTeamLength - 1;

    const newRoles = new Array(playersLength)
      .fill('Resistance', 0, playersLength)
      .fill('Spy', resTeamLength, playersLength);

    this.roles = newRoles;

    // Res
    settings.merlin && settings.assassin && resTeamLength - 1 > -1
      ? (this.roles[resTeamLength - 1] = 'Merlin')
      : (resTeamLength += 1);
    settings.percival && resTeamLength - 2 > -1 ? (this.roles[resTeamLength - 2] = 'Percival') : (resTeamLength += 1);
    // Spies
    settings.morgana && playersLength - 1 > spyTeamLength
      ? (this.roles[playersLength - 1] = 'Morgana')
      : (playersLength += 1);
    settings.assassin && settings.merlin && playersLength - 2 > spyTeamLength
      ? (this.roles[playersLength - 2] = 'Assassin')
      : (playersLength += 1);
    settings.oberon && playersLength - 3 > spyTeamLength
      ? (this.roles[playersLength - 3] = 'Oberon')
      : (playersLength += 1);
    settings.mordred && playersLength - 4 > spyTeamLength
      ? (this.roles[playersLength - 4] = 'Mordred')
      : (playersLength += 1);
  }

  // Method to call when u sit and stand up from a game
  switchSeatOnGame(player, canSit) {
    this.players.includes(player)
      ? this.players.splice(this.players.indexOf(player), 1)
      : this.players.length < this.maxPlayers && canSit
      ? this.players.push(player)
      : null;

    if (this.players.length > 0) this.host = this.players[0];
  }

  // Method to get role knowledge for each player seated
  getRoleKnowledge() {
    this.roles.forEach((r, i, arr) => {
      const name = this.players[i];
      let knowledge = [];

      switch (r) {
        case 'Resistance':
          knowledge = [...this.publicKnowledge];
          knowledge[i] = 'Resistance';
          break;
        case 'Percival':
          const merlin = arr.indexOf('Merlin');
          const morgana = arr.indexOf('Morgana');
          knowledge = [...this.publicKnowledge];
          if (merlin > -1) {
            knowledge[merlin] = 'Merlin?';
          }
          if (morgana > -1) {
            knowledge[morgana] = 'Merlin?';
          }
          knowledge[i] = 'Percival';
          break;
        case 'Merlin':
          const res1 = ['Resistance', 'Percival', 'Merlin', 'Mordred'];
          knowledge = arr.map((r2) => (res1.includes(r2) ? 'Resistance?' : 'Spy?'));
          knowledge[i] = 'Merlin';
          break;
        case 'Spy':
        case 'Assassin':
        case 'Morgana':
        case 'Mordred':
          const res2 = ['Resistance', 'Percival', 'Merlin', 'Oberon'];
          knowledge = arr.map((r2) => (res2.includes(r2) ? 'Resistance?' : 'Spy?'));
          knowledge[i] = arr[i];
          break;
        case 'Oberon':
          knowledge = [...this.publicKnowledge];
          knowledge[i] = 'Oberon';
          break;
      }

      this.privateKnowledge[name] = knowledge;
    });
  }
}

module.exports = Game;
