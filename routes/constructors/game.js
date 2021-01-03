/* global Parse */
const Chat = require('./chat');
// const _ = require('lodash');

const playerMatrix = [
  [2, 3, 2, 3, 3],
  [2, 3, 4, 3, 4],
  [2, 3, 3, 4, 4],
  [3, 4, 4, 5, 5],
  [3, 4, 4, 5, 5],
  [3, 4, 4, 5, 5],
];

class Game extends Parse.Object {
  constructor() {
    super('Game');
  }

  static spawn(props) {
    const { code } = props;
    const game = new Game();

    // Meta
    game.set('code', code);
    game.set('host', 'Anonymous');
    game.set('mode', 'Unrated');
    game.set('listed', true);
    game.set('hasClaimed', []);

    // Players
    game.set('playerList', []);
    game.set('avatarList', {});
    game.set('playerMax', 6);
    game.set('spectatorList', {});
    game.set('spectatorListNew', []);
    game.set('kickedPlayers', []);

    // Ready
    game.set('readyPlayers', []);
    game.set('askedToBeReady', false);

    // Roles
    game.set('roleList', []);
    game.set('roleSettings', {
      merlin: true,
      percival: true,
      morgana: true,
      assassin: true,
      oberon: false,
      mordred: false,
      lady: false,
    });
    game.set('hasAssassin', true);
    game.set('hasLady', false);

    // Knowledge
    game.set('publicKnowledge', new Array(10).fill('Resistance?'));
    game.set('privateKnowledge', {});

    // State
    game.set('active', true);
    game.set('started', false);
    game.set('ended', false);
    game.set('frozen', false);
    game.set('stage', 'NONE');

    // Result
    game.set('cause', -1);
    game.set('winner', -1);

    // Mission Votes
    game.set('picks', []);
    game.set('picksYetToVote', []);
    game.set('pickNames', []);
    game.set('votesRound', []);
    game.set('votesMission', []);

    // Positions
    game.set('leader', 0);
    game.set('lady', -1);
    game.set('hammer', -1);
    game.set('hammerDistance', 4);
    game.set('assassination', -1);

    // Turn
    game.set('mission', 0);
    game.set('round', 0);
    game.set('fails', 0);

    // Chat
    game.set('chat', Chat.spawn({ code: code }));

    // Mission History
    game.set('missionResults', []);
    game.set('missionPicks', [[], [], [], [], []]);
    game.set('missionVotes', [[], [], [], [], []]);
    game.set('missionLeader', [[], [], [], [], []]);

    // Card Holders
    game.set('ladyHolders', []);

    return game;
  }

  shuffleArray(array) {
    let currentIndex = array.length;

    let temporaryValue = '';
    let randomIndex = 0;

    // While there remain elements to shuffle
    while (0 !== currentIndex) {
      // Pick a remaining element
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      // And swap it with the current element
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  async toggleReady(data) {
    const { username, ready } = data;

    await this.fetch({ useMasterKey: true });

    const askedToBeReady = this.get('askedToBeReady');

    if (!askedToBeReady) return false;

    const players = this.get('playerList');
    const chat = this.get('chat');

    if (ready && players.includes(username)) {
      this.addUnique('readyPlayers', username);
    }

    return await this.save({}, { useMasterKey: true })
      .then(async (g) => {
        await chat.fetch({ useMasterKey: true });
        chat.newAnnouncement(`${username} is ${ready ? 'ready' : 'not ready'}.`);

        if (
          g.get('playerList').length === g.get('readyPlayers').length &&
          g.get('askedToBeReady')
        ) {
          g.set('askedToBeReady', false);
          g.startGame();

          return true;
        }

        return false;
      })
      .catch((e) => {
        console.log(e);

        return false;
      });
  }

  async editSettings(data) {
    const { roleSettings, playerMax } = data;

    const { length } = this.get('playerList');

    // Set player max
    // Minimum is 5 and maximum is 10
    // If number is less than player count then do nothing
    const newMax = Math.min(Math.max(length, playerMax, 5), 10);

    this.set('playerMax', newMax);

    // Prepares for role setting
    const resRoles = new Array(6).fill('Resistance');
    const spyRoles = new Array(4).fill('Spy');

    let { merlin, percival, morgana, assassin, oberon, mordred, lady } = roleSettings;

    // Set mordred
    if (mordred) {
      spyRoles.push('Mordred');
      spyRoles.shift();

      mordred = true;
    } else {
      mordred = false;
    }

    // Set oberon
    if (oberon) {
      spyRoles.push('Oberon');
      spyRoles.shift();

      oberon = true;
    } else {
      oberon = false;
    }

    // Set percival and morgana
    if (percival && morgana) {
      resRoles.push('Percival');
      resRoles.shift();

      spyRoles.push('Morgana');
      spyRoles.shift();

      percival = true;
      morgana = true;
    } else {
      percival = false;
      morgana = false;
    }

    // Set merlin and assassin
    if (merlin && assassin) {
      resRoles.push('Merlin');
      resRoles.shift();

      spyRoles.push('Assassin');
      spyRoles.shift();

      merlin = true;
      assassin = true;

      this.set('hasAssassin', true);
    } else {
      merlin = false;
      assassin = false;

      this.set('hasAssassin', false);
    }

    // Set lady of the lake
    if (lady) {
      lady = true;
    } else {
      lady = false;
    }

    this.set('hasLady', lady);

    // Save to database
    const newSettings = {
      merlin,
      percival,
      morgana,
      assassin,
      oberon,
      mordred,
      lady,
    };
    const newRoles = [
      // 5p
      resRoles[5],
      resRoles[4],
      resRoles[3],
      spyRoles[3],
      spyRoles[2],
      // 6p to 10p
      resRoles[2],
      spyRoles[1],
      resRoles[1],
      spyRoles[0],
      resRoles[0],
    ];

    this.set('roleSettings', newSettings);
    this.set('roleList', newRoles);

    await this.save({}, { useMasterKey: true });

    return true;
  }

  async addToKick(data) {
    const { kick } = data;

    this.addUnique('kickedPlayers', kick);

    await this.save({}, { useMasterKey: true });

    return true;
  }

  addClient(data) {
    const { username, avatars } = data;
    const avatarList = this.get('avatarList');

    const parsedName = username.replace(/\./gi, '/');
    avatarList[parsedName] = avatars;

    this.set('avatarList', avatarList);
    this.addUnique('spectatorListNew', username);

    this.save({}, { useMasterKey: true });

    return true;
  }

  async removeClient(data) {
    const { username } = data;

    const started = this.get('started');
    const ended = this.get('ended');

    this.remove('spectatorListNew', username);

    if (!started) {
      await this.togglePlayer({ username, add: false });
    }

    await this.save({}, { useMasterKey: true });

    // If no more clients, then delete the room.
    if (this.get('spectatorListNew').length === 0) {
      this.set('active', false);

      if (!ended) {
        await this.get('chat').destroy({ useMasterKey: true });
        await this.destroy({ useMasterKey: true });
      } else {
        this.save({}, { useMasterKey: true });
      }
    }

    return true;
  }

  toggleClaim(username) {
    const players = this.get('hasClaimed');

    if (players.includes(username)) {
      this.remove('hasClaimed', username);
    } else {
      this.addUnique('hasClaimed', username);
    }

    this.save({}, { useMasterKey: true });

    return true;
  }

  async togglePlayer(data) {
    const { username, add } = data;

    const players = this.get('playerList');
    const playerMax = this.get('playerMax');
    const kicked = this.get('kickedPlayers');

    const has = players.includes(username);

    if (has) {
      this.remove('playerList', username);
    } else if (add && players.length < playerMax && !kicked.includes(username)) {
      this.addUnique('playerList', username);
    }

    this.set('askedToBeReady', false);

    await this.save({}, { useMasterKey: true });

    this.set('host', this.get('playerList')[0]);
    this.save({}, { useMasterKey: true });

    return true;
  }

  async askToBeReady(data) {
    const { username } = data;

    const host = this.get('host');
    const players = this.get('playerList');
    const { length } = players;

    // Condition
    const canStart = host === username && length >= 5;
    if (!canStart) return false;

    this.set('readyPlayers', []);
    this.set('askedToBeReady', true);

    this.save({}, { useMasterKey: true, context: { askForReady: true } });

    setTimeout(async () => {
      await this.fetch({ useMasterKey: true });

      const started = this.get('started');

      if (!started) {
        this.set('askedToBeReady', false);

        const readyPlayers = this.get('readyPlayers');

        let players = this.get('playerList');
        players = players.filter((p) => !readyPlayers.includes(p));

        const chat = this.get('chat');
        await chat.fetch({ useMasterKey: true });

        const msg = players.map((p) =>
          chat.addMessage({ content: `${p} is not ready.` })
        );

        chat.saveMessages(msg);

        this.save({}, { useMasterKey: true });
      }
    }, 10000);
  }

  async startGame() {
    const { shuffleArray } = this;

    let players = this.get('playerList');
    const { length } = players;

    let roles = this.get('roleList').slice(0, length);

    // Start the game

    players = shuffleArray(players);
    roles = shuffleArray(roles);

    this.setRoleKnowledge({ players, length, roles });

    // Chat
    const chat = this.get('chat');
    const settings = this.get('roleSettings');
    const code = this.get('code');
    await chat.fetch({ useMasterKey: true });

    chat.onStart({ settings, code });

    // Lady
    const hasLady = this.get('hasLady');
    const leader = Math.floor(Math.random() * length);
    const lady = (leader + length) % length;

    if (hasLady) this.set('lady', lady);

    // Set everything
    this.set('leader', leader);
    this.set('playerList', players);
    this.set('roleList', roles);
    this.set('started', true);

    await this.save({}, { useMasterKey: true });
    this.newRound();

    return true;
  }

  setRoleKnowledge(data) {
    const { players, length, roles } = data;

    const publicKnowledge = this.get('publicKnowledge').slice(0, length);
    const privateKnowledge = {};

    const merlin = roles.indexOf('Merlin');
    const morgana = roles.indexOf('Morgana');

    const seemResToMerlin = ['Resistance', 'Percival', 'Merlin', 'Mordred'];
    const seemResToSpy = ['Resistance', 'Percival', 'Merlin', 'Oberon'];

    roles.forEach((role, index, array) => {
      const username = players[index];
      let knowledge = [...publicKnowledge];

      switch (role) {
        default:
          break;
        case 'Percival':
          if (merlin > -1) {
            knowledge[merlin] = 'Merlin?';
          }
          if (morgana > -1) {
            knowledge[morgana] = 'Merlin?';
          }
          break;
        case 'Merlin':
          knowledge = array.map((r) =>
            seemResToMerlin.includes(r) ? 'Resistance?' : 'Spy?'
          );
          break;
        case 'Spy':
        case 'Assassin':
        case 'Morgana':
        case 'Mordred':
          knowledge = array.map((r) =>
            seemResToSpy.includes(r) ? 'Resistance?' : 'Spy?'
          );
          break;
      }

      knowledge[index] = role;

      privateKnowledge[username.replace(/\./gi, '/')] = knowledge;
    });

    this.set('privateKnowledge', privateKnowledge);

    return true;
  }

  async newRound() {
    const ended = this.get('ended');

    if (ended) return false;

    const playerList = this.get('playerList');
    const { length: players } = playerList;

    const hammerDistance = this.get('hammerDistance');
    let hammer = this.get('hammer');
    let leader = this.get('leader');

    const round = this.get('round');

    leader = (leader + 1) % players;
    if (round === 0) hammer = (leader + hammerDistance) % players;

    this.addLeader(leader);
    this.addPicks([]);
    this.addVotes([]);

    const picks = [];
    const votesMission = [];

    this.set('stage', 'PICKING');
    this.set('leader', leader);
    this.set('hammer', hammer);
    this.set('picks', picks);
    this.set('votesMission', votesMission);

    const chat = this.get('chat');
    await chat.fetch({ useMasterKey: true });
    chat.onPick({ leader: playerList[leader] });

    await this.save({}, { useMasterKey: true });

    return true;
  }

  async pickTeam(data) {
    const { username, picks } = data;

    const playerList = this.get('playerList');
    const leader = this.get('leader');

    if (username !== playerList[leader]) return false;

    const { length: players } = playerList;
    const { length } = picks;

    const stage = this.get('stage');
    const mission = this.get('mission');
    const round = this.get('round');

    if (stage !== 'PICKING' || length !== playerMatrix[players - 5][mission])
      return false;

    const votesRound = new Array(players).fill(-1);
    const pickNames = playerList.filter((p, i) => picks.includes(i));

    this.addPicks(picks);

    this.set('stage', 'VOTING');
    this.set('picks', picks);
    this.set('picksYetToVote', picks);
    this.set('pickNames', pickNames);
    this.set('votesRound', votesRound);

    const chat = this.get('chat');
    await chat.fetch({ useMasterKey: true });
    chat.afterPick({ mission: mission + 1, round: round + 1, picks: pickNames });

    this.save({}, { useMasterKey: true });

    return true;
  }

  async voteForMission(data) {
    const { username, vote } = data;

    const stage = this.get('stage');
    if (stage !== 'VOTING') return false;

    const index = this.get('playerList').indexOf(username);
    const votesRound = this.get('votesRound');

    if (votesRound[index] === -1) {
      votesRound[index] = vote;

      this.set('votesRound', votesRound);
    } else {
      return false;
    }

    if (!votesRound.includes(-1)) {
      await this.save({}, { useMasterKey: true });
      const outcome = await this.countVotes(votesRound);

      if (outcome) {
        const pickNames = this.get('pickNames');

        this.set('stage', 'MISSION');

        const chat = this.get('chat');
        await chat.fetch({ useMasterKey: true });

        chat.afterPassing({ picks: pickNames });
      } else {
        this.newRound();
        return true;
      }
    }

    await this.save({}, { useMasterKey: true });

    return true;
  }

  async countVotes(votesRound) {
    this.addVotes(votesRound);

    const { length: players } = this.get('playerList');

    const chat = this.get('chat');
    await chat.fetch({ useMasterKey: true });

    const yes = votesRound.reduce((y, v) => (v ? y + 1 : y), 0);

    const hammerDistance = this.get('hammerDistance');
    const mission = this.get('mission');
    const round = this.get('round');

    if (yes * 2 > players) {
      chat.afterVote({ mission: mission + 1, round: round + 1, passes: true });
      return true;
    }

    await chat.afterVote({ mission: mission + 1, round: round + 1, passes: false });

    if (round === hammerDistance) {
      await this.gameEnd(3);
    }

    this.increment('round', 1);

    return false;
  }

  async voteForSuccess(data) {
    const { username, vote } = data;

    const stage = this.get('stage');
    if (stage !== 'MISSION') return false;

    const index = this.get('playerList').indexOf(username);
    const picksYetToVote = this.get('picksYetToVote');

    if (picksYetToVote.includes(index)) {
      this.add('votesMission', vote);
      this.remove('picksYetToVote', index);

      await this.save({}, { useMasterKey: true });
    } else {
      return false;
    }

    if (!this.get('picksYetToVote').length) {
      const outcome = await this.didMissionPass();
      this.addResult(outcome);
      await this.save({}, { useMasterKey: true });

      const mission = this.get('mission');
      const fails = this.get('fails');

      const hasLady = this.get('hasLady');
      const ended = this.get('ended');

      const chat = this.get('chat');
      await chat.fetch({ useMasterKey: true });

      if (mission - fails > 2) {
        const hasAssassin = this.get('hasAssassin');

        if (hasAssassin) {
          const playerList = this.get('playerList');
          const roleList = this.get('roleList');

          const assassinIndex = roleList.indexOf('Assassin');

          chat.waitingForShot({ assassin: playerList[assassinIndex] });

          this.set('stage', 'ASSASSINATION');
        } else {
          await this.gameEnd(4);
        }

        await this.save({}, { useMasterKey: true });
      } else if (hasLady && mission > 1 && !ended) {
        const playerList = this.get('playerList');
        const lady = this.get('lady');

        chat.waitingForLady({ lady: playerList[lady] });

        this.set('stage', 'CARDING');

        await this.save({}, { useMasterKey: true });
      } else if (!ended) {
        this.newRound();
      }
    }

    return true;
  }

  async didMissionPass() {
    this.increment('mission', 1);
    this.set('round', 0);

    const votesMission = this.get('votesMission');
    const fails = votesMission.reduce((f, v) => (v ? f : f + 1), 0);

    const mission = this.get('mission');
    const { length: players } = this.get('playerList');

    const chat = this.get('chat');
    await chat.fetch({ useMasterKey: true });

    if (fails === 0) {
      chat.afterMission({ mission, fails, passes: true });
      return true;
    } else if (fails === 1 && mission === 4 && players > 6) {
      chat.afterMission({ mission, fails, passes: true });
      return true;
    }

    await chat.afterMission({ mission, fails, passes: false });

    const totalFails = this.get('fails');

    if (totalFails === 2) {
      await this.gameEnd(2);
    }

    this.increment('fails', 1);
    return false;
  }

  async ladyOfTheLake(data) {
    const { username, target } = data;

    const stage = this.get('stage');
    if (stage !== 'CARDING') return false;

    const players = this.get('playerList');
    const roles = this.get('roleList');

    const index = players.indexOf(username);
    const lady = this.get('lady');
    const ladyHolders = this.get('ladyHolders');

    if (ladyHolders.includes(target) || index !== lady || index === target) return false;

    ladyHolders.push(index);

    const privateKnowledge = this.get('privateKnowledge')[
      username.replace('.', 'dot').replace('$', 'dolla')
    ];
    const chat = this.get('chat');
    await chat.fetch({ useMasterKey: true });

    if (['Mordred', 'Spy', 'Morgana', 'Oberon', 'Assassin'].includes(roles[target])) {
      privateKnowledge[target] =
        privateKnowledge[target] === 'Merlin?' ? 'Morgana' : 'Spy';
      chat.afterCard({ username, target: players[target], spy: true });
    } else {
      privateKnowledge[target] =
        privateKnowledge[target] === 'Merlin?' ? 'Merlin' : 'Resistance';
      chat.afterCard({ username, target: players[target], spy: false });
    }

    this.set('lady', target);
    this.set('ladyHolders', ladyHolders);
    this.newRound();

    return true;
  }

  async shootPlayer(data) {
    const { username, shot } = data;

    const stage = this.get('stage');
    if (stage !== 'ASSASSINATION') return false;

    const players = this.get('playerList');
    const roles = this.get('roleList');

    const index = players.indexOf(username);

    if (roles[index] !== 'Assassin') return false;

    const killed = roles[shot];

    if (['Mordred', 'Spy', 'Morgana', 'Assassin'].includes(killed)) {
      return false;
    }

    const chat = this.get('chat');
    await chat.fetch({ useMasterKey: true });

    chat.afterShot({ target: players[shot] });

    this.set('assassination', shot);
    await this.gameEnd(killed === 'Merlin' ? 0 : 1);

    this.save({}, { useMasterKey: true });

    return true;
  }

  async gameEnd(ending) {
    // 0: "Merlin was shot! The Spies Win"
    // 1: "Merlin was not shot! The Resistance wins"
    // 2: "Three missions have failed! The Spies Win"
    // 3: "The hammer was rejected! The Spies Win"
    // 4: "Three missions have succeeded! The Resistance Wins"

    const listed = this.get('listed');

    const environment = require('./environment').getGlobal();
    const generalChat = environment.get('chat');
    await generalChat.fetch({ useMasterKey: true });

    const code = this.get('code');
    const chat = this.get('chat');
    const players = this.get('playerList');
    const roles = this.get('roleList');
    await chat.fetch({ useMasterKey: true });

    this.set('ended', true);
    this.set('cause', ending);
    this.set('stage', 'NONE');
    this.set('publicKnowledge', roles);

    const winner = [1, 4].includes(ending) ? 1 : 0;

    this.set('winner', winner);

    if (listed) generalChat.roomFinished({ code, winner });
    chat.onEnd({ ending, winner });

    if (!listed) return;

    const userQ = new Parse.Query('_User');
    userQ.containedIn('username', players);

    userQ
      .find({
        useMasterKey: true,
      })
      .then((userList) => {
        userList.forEach((u) => {
          const i = players.indexOf(u.get('username'));

          u.addGameToProfile({
            code,
            role: roles[i].toLowerCase(),
            winner,
            cause: ending,
          });
        });
      })
      .catch((err) => console.log(err));
  }

  addPicks(data) {
    const mission = this.get('mission');
    const round = this.get('round');

    const missionPicks = this.get('missionPicks');

    missionPicks[mission][round] = data;

    this.set('missionPicks', missionPicks);
  }

  addVotes(data) {
    const mission = this.get('mission');
    const round = this.get('round');

    const missionVotes = this.get('missionVotes');

    missionVotes[mission][round] = data;

    this.set('missionVotes', missionVotes);
  }

  addLeader(data) {
    const mission = this.get('mission');

    const missionLeader = this.get('missionLeader');

    missionLeader[mission].push(data);

    this.set('missionLeader', missionLeader);
  }

  addResult(data) {
    const missionResults = this.get('missionResults');

    missionResults.push(data);

    this.set('missionResults', missionResults);
  }

  toRoomList() {
    // Define state of game
    const started = this.get('started');
    const frozen = this.get('frozen');
    const ended = this.get('ended');
    let state = 0;

    if (!started) {
      state = 0;
    } else if (!frozen) {
      if (!ended) {
        state = 1;
      } else {
        state = 2;
      }
    } else {
      if (!ended) {
        state = 3;
      } else {
        state = 4;
      }
    }

    // Define players and spectators
    let spectators = this.get('spectatorListNew') || [];
    const players = this.get('playerList').filter((p) => spectators.includes(p));

    spectators = Math.max(spectators.length - players.length, 0);

    // Define client
    const client = {};

    const parameters = ['code', 'host', 'mode', 'missionResults'];

    for (const x in parameters) {
      const y = parameters[x];

      client[y] = this.get(y);
    }

    return { ...client, players, spectators, state, avatars: [] };
  }

  toClient() {
    const client = {};

    const parameters = [
      'code',
      'host',
      'active',
      'playerList',
      'hasClaimed',
      'askedToBeReady',
      'avatarList',
      'playerMax',
      'spectatorList',
      'spectatorListNew',
      'kickedPlayers',
      'roleList',
      'roleSettings',
      'hasAssassin',
      'hasLady',
      'publicKnowledge',
      'privateKnowledge',
      'started',
      'ended',
      'frozen',
      'stage',
      'cause',
      'winner',
      'picks',
      'picksYetToVote',
      'pickNames',
      'votesRound',
      'votesMission',
      'leader',
      'lady',
      'hammer',
      'hammerDistance',
      'assassination',
      'mission',
      'round',
      'fails',
      'missionResults',
      'missionPicks',
      'missionVotes',
      'missionLeader',
      'ladyHolders',
    ];

    for (const x in parameters) {
      const y = parameters[x];

      client[y] = this.get(y);
    }

    return client;
  }
}

Parse.Object.registerSubclass('Game', Game);

module.exports = Game;
