/* global Parse */
const Environment = require('./environment');

const Chat = require('./chat');

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
    game.set('playerMax', 6);
    game.set('spectatorListNew', []);
    game.set('avatarListNew', []);
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
    game.set('privateKnowledgeNew', []);

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
    game.set('pickNames', []);
    game.set('picks', []);
    game.set('picksYetToVote', []);
    game.set('votesMission', []);
    game.set('votesPending', []);
    game.set('votesRound', []);

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

    // Mission History
    game.set('missionResults', []);
    game.set('missionPicks', [[], [], [], [], []]);
    game.set('missionVotes', [[], [], [], [], []]);
    game.set('missionLeader', [[], [], [], [], []]);

    game.set('chat', Chat.spawn({ code: 'Game' }));

    // Card Holders
    game.set('ladyHolders', []);

    return game;
  }

  buildChat() {
    const chat = this.get('chat');

    chat.set('game', this);
    chat.save({}, { useMasterKey: true });
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

  editSettings(data) {
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

    return true;
  }

  addToKick(data) {
    const { kick } = data;

    this.addUnique('kickedPlayers', kick);
    this.togglePlayer({ username: kick, add: false });

    return true;
  }

  async addClient(data) {
    const { username, avatars } = data;

    this.addUnique('avatarListNew', {
      username,
      avatars,
    });
    this.addUnique('spectatorListNew', username);

    await this.save({}, { useMasterKey: true });

    return true;
  }

  removeClient(data) {
    const { username } = data;

    this.remove('spectatorListNew', username);

    this.save({}, { useMasterKey: true });

    setTimeout(async () => {
      const g = await this.fetch({ useMasterKey: true });

      const started = g.get('started');
      const clients = g.get('spectatorListNew');

      // If no more clients, then delete the room.
      if (g.get('spectatorListNew').length === 0) {
        console.log('no clients');

        g.set('active', false);
        g.save({}, { useMasterKey: true });
      } else if (!started && !clients.includes(username)) {
        console.log('remove from player list');

        g.togglePlayer({ username, add: false });
      } else {
        console.log('dont remove at all');
      }
    }, 1500);

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

  togglePlayer(data, callback) {
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

    this.save({}, { useMasterKey: true })
      .then((g) => {
        g.set('host', g.get('playerList')[0]);
        g.save({}, { useMasterKey: true })
          .then(() => {
            if (callback) callback();
          })
          .catch((err) => console.log(err));
      })
      .catch((err) => console.log(err));

    return true;
  }

  askToBeReady(data) {
    // Identifies username who made this request
    const { username } = data;

    const host = this.get('host');
    const players = this.get('playerList');
    const { length } = players;

    // If player is host and the game can start this request will not return
    const canStart = host === username && length >= 5;
    if (!canStart) return false;

    // Sets ready players to an empty array
    // And asked to be ready is set to true
    // This allows player to join the ready player list
    // And tells the game that ready was asked for
    this.set('readyPlayers', []);
    this.set('askedToBeReady', true);

    this.save({}, { useMasterKey: true, context: { askForReady: true } });

    // Sets a timeout for the ready button
    setTimeout(() => {
      this.fetch({ useMasterKey: true })
        .then((g) => {
          // If the game has started ignore
          const started = g.get('started');

          if (!started) {
            // Sets ready asked to be false
            g.set('askedToBeReady', false);

            // Gets the players who readied
            const readyPlayers = g.get('readyPlayers');

            // And compares to player list to find out who didnt ready
            let players = g.get('playerList');
            players = players.filter((p) => !readyPlayers.includes(p));

            // Sends a chat message
            g.get('chat')
              .fetch({ useMasterKey: true })
              .then((c) => {
                // For each player that is not ready
                const msg = players.map((p) =>
                  c.addMessage({ content: `${p} is not ready.` })
                );

                // Then these messages are saved
                c.saveMessages(msg);
              })
              .catch((err) => console.log(err));

            // Saves the game
            g.save({}, { useMasterKey: true });
          }
        })
        .catch((err) => console.log(err));
    }, 10000);
  }

  toggleReady(data) {
    // Unpacks username and if the player is ready or not
    const { username, ready } = data;

    // Fetch from database
    this.fetch({ useMasterKey: true })
      .then((g) => {
        // Ready button was active when request was made
        const askedToBeReady = g.get('askedToBeReady');

        // If not, return
        if (!askedToBeReady) return;

        const players = g.get('playerList');
        const chat = g.get('chat');

        // If the player is ready and the player requesting is in game, add them to the ready array
        if (ready && players.includes(username)) {
          g.addUnique('readyPlayers', username);
        }

        // Fetches chat
        chat
          .fetch({ useMasterKey: true })
          .then((c) => {
            // Announces that this player is ready
            c.newAnnouncement(`${username} is ${ready ? 'ready' : 'not ready'}.`);
          })
          .catch((err) => console.log(err));

        // Saves the game
        g.save({}, { useMasterKey: true })
          .then((_g) => {
            // After the game is saved properly
            // If the player list length is the same as the amount of ready players
            // And the game is on a ready state
            // Start the game and prevent future requests for this function
            if (
              _g.get('playerList').length === _g.get('readyPlayers').length &&
              _g.get('askedToBeReady')
            ) {
              _g.set('askedToBeReady', false);
              _g.startGame();
            }
          })
          .catch((err) => console.log(err));
      })
      .catch((err) => console.log(err));
  }

  startGame() {
    // Imports shuffle array function
    const { shuffleArray } = this;

    // Gets the player list
    let players = this.get('playerList');
    const { length } = players;

    // Gets the role list
    let roles = this.get('roleList').slice(0, length);

    // Shuffles both arrays
    players = shuffleArray(players);
    roles = shuffleArray(roles);

    // Prepares role knowledge for each player
    this.setRoleKnowledge({ players, length, roles });

    // Sends a message to chat indicating the start of the game
    const chat = this.get('chat');
    const settings = this.get('roleSettings');
    const code = this.get('code');

    chat
      .fetch({ useMasterKey: true })
      .then((c) => {
        c.onStart({ settings, code });
      })
      .catch((err) => console.log(err));

    // Prepares lady of the lake if active
    const hasLady = this.get('hasLady');
    const leader = Math.floor(Math.random() * length);
    const lady = (leader + length) % length;

    if (hasLady) this.set('lady', lady);

    // Sets the remaining variables
    this.set('leader', leader);
    this.set('playerList', players);
    this.set('roleList', roles);
    this.set('started', true);

    // Saves the game
    // Sends a notification through the use of context
    // Starts the first round
    this.save({}, { useMasterKey: true, context: { started: true } })
      .then((g) => {
        g.newRound();
      })
      .catch((err) => console.log(err));

    return true;
  }

  setRoleKnowledge(data) {
    const { players, length, roles } = data;

    const publicKnowledge = this.get('publicKnowledge').slice(0, length);

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

      this.add('privateKnowledgeNew', { username, knowledge });
    });

    return true;
  }

  newRound() {
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
    chat.fetch({ useMasterKey: true }).then((c) => {
      c.onPick({ leader: playerList[leader] });
    });

    this.save({}, { useMasterKey: true });

    return true;
  }

  pickTeam(data) {
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

    const pickNames = playerList.filter((p, i) => picks.includes(i));

    this.addPicks(picks);

    this.set('stage', 'VOTING');
    this.set('picks', picks);
    this.set('picksYetToVote', pickNames);
    this.set('pickNames', pickNames);
    this.set('votesPending', playerList);
    this.set('votesRound', []);

    const chat = this.get('chat');
    chat
      .fetch({ useMasterKey: true })
      .then((c) =>
        chat.afterPick({ mission: mission + 1, round: round + 1, picks: pickNames })
      )
      .catch((err) => console.log(err));

    this.save({}, { useMasterKey: true });

    return true;
  }

  voteForMission(data) {
    const { username, vote } = data;

    const stage = this.get('stage');
    if (stage !== 'VOTING') return false;

    const votesPending = this.get('votesPending');

    if (votesPending.includes(username)) {
      this.remove('votesPending', username);
      this.add('votesRound', vote ? '-' : username);

      console.log('before save picking', this.get('votesRound'));

      this.save({}, { useMasterKey: true })
        .then((g) => {
          console.log('after save picking', g.get('votesRound'));

          const _votesPending = g.get('votesPending');
          const _votesRound = g.get('votesRound');
          const playerList = g.get('playerList');

          if (!_votesPending.length && _votesRound.length === playerList.length) {
            g.countVotes()
              .then((result) => {
                const ended = g.get('ended');

                if (result) {
                  const pickNames = g.get('pickNames');

                  g.set('stage', 'MISSION');
                  g.save({}, { useMasterKey: true });

                  const chat = g.get('chat');
                  chat
                    .fetch({ useMasterKey: true })
                    .then((c) => c.afterPassing({ picks: pickNames }))
                    .catch((err) => console.log(err));
                } else if (!ended) {
                  g.newRound();
                } else {
                  g.save({}, { useMasterKey: true });
                }
              })
              .catch((err) => console.log(err));
          }
        })
        .catch((err) => console.log(err));

      return true;
    }

    return false;
  }

  async countVotes() {
    const votesRound = this.get('votesRound');
    const playerList = this.get('playerList');

    this.addVotes(playerList.map((p) => (votesRound.includes(p) ? 0 : 1)));

    const chat = this.get('chat');
    await chat.fetch({ useMasterKey: true });

    const rejects = votesRound.filter((v) => v !== '-').length;

    const hammerDistance = this.get('hammerDistance');
    const mission = this.get('mission');
    const round = this.get('round');

    if (rejects * 2 < playerList.length) {
      chat.afterVote({ mission: mission + 1, round: round + 1, passes: true });
      return true;
    }

    chat.afterVote({ mission: mission + 1, round: round + 1, passes: false });

    if (round === hammerDistance) {
      this.gameEnd(3);
    }

    this.increment('round', 1);

    return false;
  }

  voteForSuccess(data) {
    const { username, vote } = data;

    const stage = this.get('stage');
    if (stage !== 'MISSION') return false;

    const picksYetToVote = this.get('picksYetToVote');

    if (picksYetToVote.includes(username)) {
      this.remove('picksYetToVote', username);
      this.add('votesMission', vote ? '-' : username);

      console.log('before save mission', this.get('votesMission'));

      this.save({}, { useMasterKey: true })
        .then((g) => {
          console.log('after save mission', g.get('votesMission'));

          const _picksYetToVote = g.get('picksYetToVote');
          const _votesMission = g.get('votesRound');
          const playerList = g.get('playerList');

          if (!_picksYetToVote.length && _votesMission.length === playerList.length) {
            g.didMissionPass()
              .then((result) => {
                g.addResult(result);

                const mission = g.get('mission');
                const fails = g.get('fails');

                const hasLady = g.get('hasLady');
                const ended = g.get('ended');

                const chat = g.get('chat');

                if (mission - fails > 2) {
                  const hasAssassin = g.get('hasAssassin');

                  if (hasAssassin) {
                    const roleList = g.get('roleList');

                    const assassinIndex = roleList.indexOf('Assassin');

                    g.set('stage', 'ASSASSINATION');

                    chat
                      .fetch({ useMasterKey: true })
                      .then((c) =>
                        c.waitingForShot({ assassin: playerList[assassinIndex] })
                      )
                      .catch((err) => console.log(err));
                  } else {
                    g.gameEnd(4);
                  }

                  g.save({}, { useMasterKey: true });
                } else if (hasLady && mission > 1 && !ended) {
                  const lady = g.get('lady');

                  chat
                    .fetch({ useMasterKey: true })
                    .then((c) => c.waitingForLady({ lady: playerList[lady] }))
                    .catch((err) => console.log(err));

                  g.set('stage', 'CARDING');
                  g.save({}, { useMasterKey: true });
                } else if (!ended) {
                  g.newRound();
                } else {
                  g.save({}, { useMasterKey: true });
                }
              })
              .catch((err) => console.log(err));
          }
        })
        .catch((err) => console.log(err));

      return true;
    }

    return false;
  }

  async didMissionPass() {
    this.increment('mission', 1);
    this.set('round', 0);

    const votesMission = this.get('votesMission');
    const fails = votesMission.filter((v) => v !== '-').length;

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

    chat.afterMission({ mission, fails, passes: false });

    const totalFails = this.get('fails');

    if (totalFails === 2) {
      this.gameEnd(2);
    }

    this.increment('fails', 1);
    return false;
  }

  ladyOfTheLake(data) {
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

    const privateKnowledge = this.get('privateKnowledgeNew');
    const chat = this.get('chat');

    chat
      .fetch({ useMasterKey: true })
      .then((c) => {
        const percivalToMerlin = privateKnowledge[index].knowledge[target] === 'Merlin?';

        if (['Mordred', 'Spy', 'Morgana', 'Oberon', 'Assassin'].includes(roles[target])) {
          privateKnowledge[index].knowledge[target] = percivalToMerlin
            ? 'Morgana'
            : 'Spy';
          c.afterCard({ username, target: players[target], spy: true });
        } else {
          privateKnowledge[index].knowledge[target] = percivalToMerlin
            ? 'Merlin'
            : 'Resistance';
          c.afterCard({ username, target: players[target], spy: false });
        }

        this.set('privateKnowledgeNew', privateKnowledge);
        this.set('lady', target);
        this.set('ladyHolders', ladyHolders);
        this.newRound();
      })
      .catch((err) => console.log(err));

    return true;
  }

  shootPlayer(data) {
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

    this.set('assassination', shot);

    const chat = this.get('chat');
    chat
      .fetch({ useMasterKey: true })
      .then((c) => {
        c.afterShot({ target: players[shot] });

        this.gameEnd(killed === 'Merlin' ? 0 : 1);

        this.save({}, { useMasterKey: true });
      })
      .catch((err) => console.log(err));

    return true;
  }

  gameEnd(ending) {
    // 0: "Merlin was shot! The Spies Win"
    // 1: "Merlin was not shot! The Resistance wins"
    // 2: "Three missions have failed! The Spies Win"
    // 3: "The hammer was rejected! The Spies Win"
    // 4: "Three missions have succeeded! The Resistance Wins"

    if (this.get('ended')) return false;

    const listed = this.get('listed');

    const code = this.get('code');
    const chat = this.get('chat');
    const players = this.get('playerList');
    const roles = this.get('roleList');

    this.set('ended', true);
    this.set('cause', ending);
    this.set('stage', 'NONE');
    this.set('publicKnowledge', roles);

    const winner = [1, 4].includes(ending) ? 1 : 0;

    this.set('winner', winner);

    Environment.getGlobal().then((e) => {
      const generalChat = e.get('chat');

      if (listed)
        generalChat
          .fetch({ useMasterKey: true })
          .then((c) => c.roomFinished({ code, winner }))
          .catch((err) => console.log(err));
    });

    chat
      .fetch({ useMasterKey: true })
      .then((c) => c.onEnd({ code, ending, winner }))
      .catch((err) => console.log(err));

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
            size: players.length,
            date: this.get('createdAt'),
            id: this.id,
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

    if (started) {
      if (!frozen) {
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
    }

    // Define players and spectators
    let spectators = this.get('spectatorListNew') || [];
    const players = this.get('playerList').filter((p) => spectators.includes(p));

    spectators = Math.max(spectators.length - players.length, 0);

    // Define client
    const client = {};

    const parameters = ['gameId', 'code', 'host', 'mode', 'missionResults'];

    parameters.forEach((parameter) => {
      client[parameter] = this.get(parameter);
    });

    client['gameId'] = this.id;

    return { ...client, players, spectators, state, avatars: [] };
  }

  toClient() {
    const client = {};

    const parameters = [
      'gameId',
      'code',
      'host',
      'active',
      'playerList',
      'hasClaimed',
      'askedToBeReady',
      'avatarListNew',
      'playerMax',
      'spectatorListNew',
      'kickedPlayers',
      'roleList',
      'roleSettings',
      'hasAssassin',
      'hasLady',
      'publicKnowledge',
      'privateKnowledgeNew',
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
      'votesPending',
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

    parameters.forEach((parameter) => {
      client[parameter] = this.get(parameter);
    });

    client['gameId'] = this.id;

    return client;
  }
}

Parse.Object.registerSubclass('Game', Game);

module.exports = Game;
