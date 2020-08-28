const GameClass = require('./room/game');
const ActionsClass = require('./room/actions');
const MissionsClass = require('./room/missions');
const ChatClass = require('../chat/chat');

let activeRooms = {};

class RoomHandler {
  constructor(roomname) {
    this.roomName = roomname;
  }

  // Method to create a game
  createGame(maxPlayers) {
    const game = new GameClass(this.roomName, [], [], maxPlayers);
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

    // Get Game Variables
    let playerCount = game.players.length;
    let hasAssassin = game.roleSettings.assassin && game.roleSettings.merlin;
    let hasCard = game.roleSettings.card;

    // New Missions
    const missions = new MissionsClass(this.roomName);

    // New Actions
    const actions = new ActionsClass(this.roomName, playerCount, hasAssassin, hasCard, game, missions, chat);
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

  // Get room ids
  getRoomList() {
    const arr = [];

    for (let id in activeRooms) {
      arr.push(id);
    }

    return arr;
  }
}

module.exports = RoomHandler;
