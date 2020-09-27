const Parse = require('../parse/parse');
const Profile = require('../profile/profile');
const GameClass = require('./room/game');
const ActionsClass = require('./room/actions');
const MissionsClass = require('./room/missions');
const ChatClass = require('../chat/chat');

let activeRooms = {};

const replayAttributes = [
  'code',
  // Player Info
  'players',
  // Game State
  'started',
  'ended',
  'frozen',
  'cause',
  'assassination',
  // Knowledge
  'publicKnowledge',
  // Power Posts
  'hammer',
  'card',
  // Mission
  'mission',
  'round',
  // Settings
  'roleSettings',
  'playerMax',
  // History
  'results',
  'cardHolders',
  'missionLeader',
  'missionVotes',
  'missionTeams',
];

class RoomClient {
  constructor() {
    this.seat = -1;
    this.username = 'NONAME';

    this.players = [];
    this.clients = [];
    this.imRes = true;

    this.started = false;
    this.ended = false;
    this.frozen = false;
    this.stage = '';
    this.cause = -1;
    this.assassination = -1;

    this.picks = [];
    this.picksYetToVote = [];
    this.votesRound = [];

    this.publicKnowledge = [];
    this.privateKnowledge = [];

    this.leader = -1;
    this.hammer = -1;
    this.card = -1;
    this.assassin = false;

    this.mission = -1;
    this.round = -1;

    this.code = '-1';

    this.roleSettings = {};
    this.playerMax = -1;

    this.results = [[], [], [], [], []];
    this.cardHolders = [[], [], [], [], []];
    this.missionLeader = [[], [], [], [], []];
    this.missionVotes = [[], [], [], [], []];
    this.missionTeams = [[], [], [], [], []];
  }

  async getFromRoom(room, code, username) {
    const game = room.game;
    const actions = room.actions;
    const missions = room.missions;

    this.seat = game.players.indexOf(username);
    this.username = username;

    this.players = game.players;
    this.clients = Object.keys(game.clients);
    this.imRes = ['Resistance', 'Percival'].includes(game.roles[this.seat]);

    this.started = game.started;
    this.ended = actions.ended;
    this.frozen = actions.frozen;
    this.stage = actions.stage;
    this.cause = actions.cause;
    this.assassination = actions.assassination;

    this.picks = actions.picks;
    this.picksYetToVote = actions.picksYetToVote;
    this.votesRound = actions.votesRound;

    this.publicKnowledge = game.publicKnowledge;
    this.privateKnowledge = game.privateKnowledge[username] ? game.privateKnowledge[username] : [];

    this.leader = actions.leader;
    this.hammer = actions.hammer;
    this.card = actions.card;
    this.assassin = game.roles[this.seat] === 'Assassin';

    this.mission = actions.mission;
    this.round = actions.round;

    this.code = code;

    this.roleSettings = game.roleSettings;
    this.playerMax = game.maxPlayers;

    this.results = missions.missionResults;
    this.cardHolders = missions.cardHolders;
    this.missionLeader = missions.missionLeader;
    this.missionVotes = missions.missionVotes;
    this.missionTeams = missions.missionPicks;

    if (actions.stage === 'PICKING') {
      this.missionVotes = [...this.missionVotes];
      this.missionTeams = [...this.missionTeams];

      this.missionVotes[actions.mission][actions.round] = [];
      this.missionTeams[actions.mission][actions.round] = [];
    }

    return this;
  }
}

class RoomHandler {
  constructor(roomname) {
    this.roomName = roomname;
  }

  // Method to create a game
  createGame(maxPlayers) {
    const game = new GameClass(maxPlayers);
    const chat = new ChatClass();

    return this.setRoom(game, {}, {}, chat);
  }

  // Method to call in a room once everyone is ready to start a game
  initGame(username) {
    // Get room
    const room = this.getRoom();
    const game = room.game;
    const chat = room.chat;

    // Condition
    const canStart = game.players[0] === username && game.players.length >= 5;
    if (!canStart) return false;

    // Assign Positions
    const shuffle = this.createRoles(game.players, game.roles);

    // Start the game
    game.players = shuffle[0];
    game.roles = shuffle[1];
    game.started = true;

    game.getRoleKnowledge();

    // New Missions
    const missions = new MissionsClass();

    // New Actions
    const actions = new ActionsClass(this.roomName, game, missions, chat);
    actions.newRound();

    // Chat
    chat.onStart(game.roleSettings, this.roomName);

    // Init Complete
    this.setRoom(game, actions, missions, chat);

    return true;
  }

  // Create random roles and players
  createRoles(players, roles) {
    let playersRandomized;
    let rolesRandomized;

    playersRandomized = this.shuffleArray(players);
    rolesRandomized = this.shuffleArray(roles);

    return [playersRandomized, rolesRandomized];
  }

  // Array shuffler to mix roles and seats
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

  // Get room from room container
  getRoom() {
    const id = this.roomName.toString();

    if (!activeRooms.hasOwnProperty(id)) {
      throw new Error('Room requested does not exist: ' + id);
    }

    return activeRooms[id];
  }

  // Set room to room container
  setRoom(game, actions, missions, chat) {
    const id = this.roomName.toString();

    if (!activeRooms.hasOwnProperty(id)) {
      activeRooms[id] = {
        game: game,
        actions: actions,
        missions: missions,
        chat: chat,
      };
    } else {
      let room = activeRooms[id];

      room.game = game;
      room.actions = actions;
      room.missions = missions;
      room.chat = chat;
    }

    return activeRooms[id];
  }

  // Send room to client
  async createRoomClient(username) {
    const room = this.getRoom();

    return await new RoomClient().getFromRoom(room, this.roomName, username);
  }

  // Get Room List
  createRoomLink(id, room) {
    return new Promise((resolve) => {
      const game = room.game;
      const actions = room.actions;
      const missions = room.missions;

      const seat = game.players.indexOf(username);
      const results = game.started ? missions.missionResults : [];
      let spectators = 0;
      let gameState = -1;

      if (!game.started) {
        gameState = 0;
      } else if (!actions.frozen) {
        if (!actions.ended) {
          gameState = 1;
        } else {
          gameState = 2;
        }
      } else {
        if (!actions.ended) {
          gameState = 3;
        } else {
          gameState = 4;
        }
      }

      for (const cli in game.clients) {
        if (!game.players.includes(cli)) spectators++;
      }

      resolve({
        no: id,
        results: [results[0], results[1], results[2], results[3], results[4]],
        avatars: [],
        host: game.host,
        mode: 'UNRATED',
        spectators: spectators,
        gameState: gameState,
      });
    });
  }

  async getRoomList() {
    const roomLinks = [];

    for (let id in activeRooms) {
      roomLinks.push(this.createRoomLink(id, activeRooms[id]));
    }

    return await Promise.all(roomLinks);
  }

  // Delete a Room
  deleteRoom() {
    const id = this.roomName;
    if (id in activeRooms) {
      delete activeRooms[id];
    } else {
      console.log('ERROR: Room ' + id + ' does not exist.');
    }
  }

  // Protocol for when games end
  // Should save to database and update players' stats
  gameEndProtocol() {
    this.saveToDatabase();
    this.updatePlayerStats();
  }

  async saveToDatabase() {
    const GameReplay = Parse.Object.extend('Game');

    try {
      const gc = await this.createRoomClient(undefined);
      const gr = new GameReplay();

      for (const x in gc) {
        if (replayAttributes.includes(x)) gr.set(x, gc[x]);
      }

      gr.set('chat', this.getRoom().chat.messages);

      gr.save({}, { useMasterKey: true });
    } catch (err) {
      console.log(err);
    }
  }

  async updatePlayerStats() {
    try {
      const room = this.getRoom();
      const game = room.game;
      const actions = room.actions;

      const players = game.players;
      const roles = game.roles;
      const promises = [];

      for (const x in players) {
        const p = players[x];

        promises.push(new Profile(p).getFromUser());
      }

      const profiles = await Promise.all(promises);

      for (const y in profiles) {
        const pr = profiles[y];

        pr.addGameToProfile({
          winner: actions.winner,
          cause: actions.cause,
          role: roles[y].toLowerCase(),
          res: ['Resistance', 'Percival', 'Merlin'].includes(roles[y]) ? 1 : 0,
          code: this.roomName,
        });

        pr.saveToUser();
      }
    } catch (err) {
      console.log(err);
    }
  }

  // Retrieve a room from the database
  async retrieveFromDatabase(username) {
    const query = new Parse.Query('Game');
    query.equalTo('code', this.roomName);

    return await query
      .first({
        useMasterKey: true,
      })
      .then((game) => {
        if (!game) return undefined;

        const gc = new RoomClient();

        for (const x in gc) {
          if (replayAttributes.includes(x)) gc[x] = game.get(x);
        }

        gc.stage = 'REPLAY';

        gc.username = username;
        gc.clients = gc.players;
        gc.code = this.roomName;

        return gc;
      })
      .catch((err) => {
        console.log(err);
      });
  }
}

module.exports = RoomHandler;
