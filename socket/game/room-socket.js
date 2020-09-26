const Parse = require('../parse/parse');
const Profile = require('../profile/profile');
const RoomHandler = require('./room-handler');
const GeneralChat = require('../chat/general-chat');

module.exports = function (io, socket) {
	const GEN_CHAT = 'GeneralChat';
	const GAME_CHAT = 'GameChat';
	const GAME_LIST_NAME = 'RoomList';
	const GAME_NAME = 'Room';

	const getGlobals = async (data) => {
		const query = new Parse.Query('Globals');
		query.equalTo('env', 'Main');

		return await query.find({
			useMasterKey: true,
		});
	};

	const emissionProtocol = (updateRoomList, updateChat, roomHandler, startEndProtocol) => {
		if (startEndProtocol) io.to(GEN_CHAT).emit('generalChatUpdate');

		io.to(GAME_NAME + socket.room).emit('gameUpdate');

		if (updateRoomList) io.to(GAME_LIST_NAME).emit('roomListUpdate');
		if (updateChat) io.to(GAME_CHAT + socket.room).emit('gameChatUpdate');
	};

	const afterLeave = () => {
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(socket.room);

			try {
				const room = handler.getRoom();
				const game = room.game;
				const chat = room.chat;

				if (!game.clients.hasOwnProperty(username)) {
					console.log('Invalid Request');
				} else if (game.clients[username].sockets.includes(socket.id)) {
					const socketIndex = game.clients[username].sockets.indexOf(socket.id);
					game.clients[username].sockets.splice(socketIndex, 1);
				}

				if (game.clients[username].sockets.length === 0) {
					chat.onEnter(username, false);

					// If sockets are empty, then there are no connections for this client,
					// so remove it from the object so we can reap the room. If the client
					// reconnects, they will be readded to the clients objects anyways.
					delete game.clients[username];

					if (!game.started) {
						game.switchSeatOnGame(username, false);
						game.setRolesOnGame(game.roleSettings, game.maxPlayers);
					}

					emissionProtocol(true, true, handler, false);
				}

				// If no more clients, then delete the room.
				if (Object.keys(game.clients).length === 0) {
					handler.deleteRoom();
					// Notify other players room has been deleted.
					io.to(GAME_LIST_NAME).emit('roomListUpdate');
				}

				socket.off('disconnect', afterLeave);

				delete socket.room;
			} catch (err) {
				console.log(err);
			}
		}
	};

	const roomLeave = () => {
		socket.leave(GAME_NAME + socket.room);
		socket.leave(GAME_CHAT + socket.room, afterLeave);
	};

	const roomJoin = (r) => {
		const initialUpdate = () => {
			socket.emit('gameUpdate');
			socket.join(GAME_CHAT + r, afterJoin);
		};

		const afterJoin = () => {
			const user = socket.user;

			if (user) {
				const username = user.get('username');
				const handler = new RoomHandler(r);

				try {
					const room = handler.getRoom();
					const game = room.game;
					const chat = room.chat;

					socket.room = r;

					if (!game.clients.hasOwnProperty(username)) {
						game.clients[username] = {
							timestamp: Date.now(),
							sockets: [socket.id],
						};

						chat.onEnter(username, true);

						emissionProtocol(true, true, handler, false);
					} else if (!game.clients[username].sockets.includes(socket.id)) {
						game.clients[username].sockets.push(socket.id);

						socket.emit('gameChatUpdate');
					}

					socket.on('disconnect', afterLeave);
				} catch (err) {
					console.log(err);
					socket.emit('gameNotFound');
				}
			}
		};

		socket.join(GAME_NAME + r, initialUpdate);
	};

	const voteHistoryParsing = (missions, actions) => {
		return new Promise((resolve) => {
			// Past Mission Info
			let results = [];
			let cardHolders = [];
			const missionLeader = [[], [], [], [], []];
			const missionVotes = [[], [], [], [], []];
			const missionTeams = [[], [], [], [], []];

			if (Object.keys(missions).length > 0) {
				results = missions.missionResults;
				cardHolders = missions.cardHolders;

				for (let i = 0; i < 5; i++) {
					const i_miss = i + 1;

					const currentLeader = missions['m' + i_miss + 'leader'];
					missionLeader[i] = currentLeader.length > 0 ? currentLeader : [];

					for (let j = 0; j < 5; j++) {
						const j_miss = j + 1;

						const currentVotes = missions['m' + i_miss + j_miss + 'votes'];
						const currentTeam = missions['m' + i_miss + j_miss + 'picks'];

						if (currentVotes.length > 0) {
							missionVotes[i][j] = currentVotes;
							missionTeams[i][j] = currentTeam;
						} else if (currentTeam.length > 0) {
							missionTeams[i][j] = currentTeam;
							missionVotes[i][j] = [];
						}
					}
				}

				if (actions.stage === 'PICKING') {
					missionVotes[actions.mission][actions.round] = [];
					missionTeams[actions.mission][actions.round] = [];
				}
			}

			resolve({
				results,
				cardHolders,
				missionLeader,
				missionVotes,
				missionTeams,
			});
		});
	};

	const gameRequest = async () => {
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(socket.room);

			try {
				const room = handler.getRoom();
				const game = room.game;
				const actions = room.actions;
				const missions = room.missions;

				const seat = game.players.indexOf(username);
				const history = voteHistoryParsing(missions, actions);

				let response = {
					// Player Info
					seat: seat,
					username: username,
					players: game.players,
					clients: Object.keys(game.clients),
					imRes: ['Resistance', 'Percival'].includes(game.roles[seat]),
					// Don't include Merlin, this is for disallowing fail button on missions
					// Game State Info
					started: game.started,
					ended: actions.ended,
					frozen: actions.frozen,
					stage: actions.stage,
					cause: actions.cause,
					assassination: actions.assassination,
					// Game Pick Info
					picks: actions.picks,
					picksYetToVote: actions.picksYetToVote,
					votesRound: actions.votesRound,
					// Game Knowledge
					publicKnowledge: game.publicKnowledge,
					privateKnowledge: game.privateKnowledge[username] ? game.privateKnowledge[username] : [],
					// Game Power Positions
					leader: actions.leader,
					hammer: actions.hammer,
					card: actions.card,
					assassin: game.roles[seat] === 'Assassin',
					// Game Mission Info
					mission: actions.mission,
					round: actions.round,
					// Room Number
					code: game.roomName,
					// Game Settings
					roleSettings: game.roleSettings,
					playerMax: game.maxPlayers,
					...(await history),
				};

				// Send to client
				socket.emit('gameResponse', response);
			} catch (err) {
				console.log(err);
			}
		}
	};

	const createGame = async (data) => {
		// Data
		// > roleSettings
		// > maxPlayers
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const globals = await getGlobals();

			const main = globals[0];
			const games = main.get('games');
			main.increment('games');

			const handler = new RoomHandler(games);
			const room = handler.createGame(data.maxPlayers);
			const game = room.game;

			GeneralChat.roomCreated(username, games);

			game.switchSeatOnGame(username, true);
			game.setRolesOnGame(data.roleSettings, data.maxPlayers);

			socket.emit('createGameSuccess', games);

			io.to(GEN_CHAT).emit('generalChatUpdate');
			io.to(GAME_LIST_NAME).emit('roomListUpdate');

			main.save({}, { useMasterKey: true });
		}
	};

	const joinLeaveGame = (data) => {
		// Data
		// > canSit
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(socket.room);

			try {
				const room = handler.getRoom();
				const game = room.game;

				if (game.started) return false;
				// Kicked players cannot re-join game.
				if (game.kickedPlayers.has(username)) return false;

				game.switchSeatOnGame(username, data.canSit);
				game.setRolesOnGame(game.roleSettings, game.maxPlayers);
			} catch (err) {
				console.log(err);
			}

			emissionProtocol(true, true, handler, false);
			return true;
		}
	};

	const editGame = (data) => {
		// Data
		// > roleSettings
		// > maxPlayers
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(socket.room);

			try {
				const room = handler.getRoom();
				const game = room.game;

				if (game.players[0] !== username) return false;

				game.setRolesOnGame(data.roleSettings, data.maxPlayers);
			} catch (err) {
				console.log(err);
			}

			emissionProtocol(true, false, handler, false);
			return true;
		}
	};

	const startGame = () => {
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(socket.room);

			try {
				if (handler.initGame(username)) {
					emissionProtocol(true, true, handler, false);
					return true;
				}
				return false;
			} catch (err) {
				console.log(err);
			}
		}
	};

	const pickTeam = (data) => {
		// Data
		// > team
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(socket.room);

			try {
				const room = handler.getRoom();
				const game = room.game;
				const actions = room.actions;

				const playerIndex = game.players.indexOf(username);

				if (playerIndex > -1 && actions.pickTeam(playerIndex, data.team)) {
					emissionProtocol(false, true, handler, false);
					return true;
				}
				return false;
			} catch (err) {
				console.log(err);
			}
		}
	};

	const voteForMission = (data) => {
		// Data
		// > vote
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(socket.room);

			try {
				const room = handler.getRoom();
				const game = room.game;
				const actions = room.actions;

				const playerIndex = game.players.indexOf(username);

				if (playerIndex > -1 && actions.voteForMission(playerIndex, data.vote)) {
					emissionProtocol(actions.ended, true, handler, actions.ended);
					return true;
				}
				return false;
			} catch (err) {
				console.log(err);
			}
		}
	};

	const voteForSuccess = (data) => {
		// Data
		// > vote
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(socket.room);

			try {
				const room = handler.getRoom();
				const game = room.game;
				const actions = room.actions;

				const playerIndex = game.players.indexOf(username);

				if (playerIndex > -1 && actions.voteForSuccess(playerIndex, data.vote)) {
					emissionProtocol(!actions.picksYetToVote.length, true, handler, actions.ended);
					return true;
				}

				return false;
			} catch (err) {
				console.log(err);
			}
		}
	};

	const cardPlayer = (data) => {
		// Data
		// > carded
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(socket.room);

			try {
				const room = handler.getRoom();
				const game = room.game;
				const actions = room.actions;

				const playerIndex = game.players.indexOf(username);

				if (playerIndex > -1 && actions.cardPlayer(playerIndex, data.carded)) {
					emissionProtocol(false, true, handler, false);
					return true;
				}
				return false;
			} catch (err) {
				console.log(err);
			}
		}
	};

	const shootPlayer = (data) => {
		// Data
		// > shot
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(socket.room);

			try {
				const room = handler.getRoom();
				const game = room.game;
				const actions = room.actions;

				const playerIndex = game.players.indexOf(username);

				if (playerIndex > -1 && actions.shootPlayer(playerIndex, data.shot)) {
					emissionProtocol(true, true, handler, actions.ended);
					return true;
				}
				return false;
			} catch (err) {
				console.log(err);
			}
		}
	};

	const kickPlayer = (data) => {
		// Data
		// > kick
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(socket.room);

			try {
				const room = handler.getRoom();
				const game = room.game;
				const chat = room.chat;

				// Can't kick people after game starts.
				if (game.started) return false;
				// Only the host can kick people.
				if (username !== game.host) return false;
				const playerIndex = game.players.indexOf(data.kick);

				if (playerIndex > -1) {
					game.kickedPlayers.add(data.kick);
					game.switchSeatOnGame(data.kick, false);
					game.setRolesOnGame(game.roleSettings, game.maxPlayers);
					chat.kickPlayer(game.host, data.kick);
					emissionProtocol(true, true, handler, false);

					return true;
				}
			} catch (err) {
				console.log(err);
			}
		}
		return false;
	};

	socket
		.on('roomJoin', roomJoin)
		.on('roomLeave', roomLeave)
		.on('gameRequest', gameRequest)
		.on('createGame', createGame)
		.on('joinLeaveGame', joinLeaveGame)
		.on('editGame', editGame)
		.on('startGame', startGame)
		.on('pickTeam', pickTeam)
		.on('voteForMission', voteForMission)
		.on('voteForSuccess', voteForSuccess)
		.on('cardPlayer', cardPlayer)
		.on('shootPlayer', shootPlayer)
		.on('kickPlayer', kickPlayer);
};
