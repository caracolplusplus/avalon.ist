const Parse = require('../parse/parse');
const Profile = require('../profile/profile');
const RoomHandler = require('./room-handler');
const GeneralChat = require('../chat/general-chat');
const ClientsOnline = require('../auth/clients-online');

module.exports = function (io, socket) {
	const LINK_NAME = 'RoomLink';
	const GEN_CHAT = 'GeneralChat';
	const GAME_LIST_NAME = 'RoomList';
	const GAME_NAME = 'Room';
	const GAME_CHAT = 'GameChat';

	const getGlobals = async (data) => {
		const query = new Parse.Query('Globals');
		query.equalTo('env', 'Main');

		return await query.find({
			useMasterKey: true,
		});
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

					if (!game.started) {
						game.switchSeatOnGame(username, false);
						game.setRolesOnGame(game.roleSettings, game.maxPlayers);
					}

					io.to(GAME_CHAT + socket.room).emit('gameChatUpdate');
					io.to(LINK_NAME + socket.room).emit('roomLinkUpdate' + socket.room);
					io.to(GAME_NAME + socket.room).emit('gameUpdate');
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

					const sendJoinMessage = () => {
						if (game.clients[username].sockets.length === 1) {
							chat.onEnter(username, true);
							io.to(GAME_CHAT + r).emit('gameChatUpdate');
							io.to(GAME_NAME + r).emit('gameUpdate');
							io.to(LINK_NAME + r).emit('roomLinkUpdate' + r);
						} else {
							socket.emit('gameChatUpdate');
						}
					};

					if (!game.clients.hasOwnProperty(username)) {
						const profile = new Profile(username);

						game.clients[username] = {
							profile: profile,
							sockets: [socket.id],
						};

						sendJoinMessage();
					} else if (!game.clients[username].sockets.includes(socket.id)) {
						game.clients[username].sockets.push(socket.id);
						game.clients[username].profile.getFromUser();
						sendJoinMessage();
					}

					socket.on('disconnect', afterLeave);
				} catch (err) {
					console.log(err);
				}
			}
		};

		socket.join(GAME_NAME + r, initialUpdate);
	};

	const gameRequest = () => {
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(socket.room);

			try {
				const room = handler.getRoom();
				const game = room.game;
				const actions = room.actions;
				const missions = room.missions;

				const clients = [];

				for (cli in game.clients) {
					const currentClient = game.clients[cli];

					if (currentClient.sockets.length > 0) clients.push(cli);
				}

				const seat = game.players.indexOf(username);

				let response = {
					// Player Info
					username: username,
					players: game.players,
					clients: clients,
					seat: seat,
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
					votesRound: actions.votesRound,
					voted: actions.voted,
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
				};

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

				response.results = results;
				response.cardHolders = cardHolders;
				response.missionLeader = missionLeader;
				response.missionVotes = missionVotes;
				response.missionTeams = missionTeams;

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

				game.switchSeatOnGame(username, data.canSit);
				game.setRolesOnGame(game.roleSettings, game.maxPlayers);
			} catch (err) {
				console.log(err);
			}

			io.to(GAME_CHAT + socket.room).emit('gameChatUpdate');
			io.to(GAME_NAME + socket.room).emit('gameUpdate');
			io.to(LINK_NAME + socket.room).emit('roomLinkUpdate' + socket.room);
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

			io.to(GAME_NAME + socket.room).emit('gameUpdate');
			io.to(LINK_NAME + socket.room).emit('roomLinkUpdate' + socket.room);
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
					io.to(GAME_CHAT + socket.room).emit('gameChatUpdate');
					io.to(GAME_NAME + socket.room).emit('gameUpdate');
					io.to(LINK_NAME + socket.room).emit('roomLinkUpdate' + socket.room);
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
					io.to(GAME_CHAT + socket.room).emit('gameChatUpdate');
					io.to(GAME_NAME + socket.room).emit('gameUpdate');
					io.to(LINK_NAME + socket.room).emit('roomLinkUpdate' + socket.room);
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
					if (actions.ended) io.to(GEN_CHAT).emit('generalChatUpdate');
					io.to(GAME_CHAT + socket.room).emit('gameChatUpdate');
					io.to(GAME_NAME + socket.room).emit('gameUpdate');
					io.to(LINK_NAME + socket.room).emit('roomLinkUpdate' + socket.room);
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
					if (actions.ended) io.to(GEN_CHAT).emit('generalChatUpdate');
					io.to(GAME_CHAT + socket.room).emit('gameChatUpdate');
					io.to(GAME_NAME + socket.room).emit('gameUpdate');
					io.to(LINK_NAME + socket.room).emit('roomLinkUpdate' + socket.room);
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
					io.to(GAME_CHAT + socket.room).emit('gameChatUpdate');
					io.to(GAME_NAME + socket.room).emit('gameUpdate');
					io.to(LINK_NAME + socket.room).emit('roomLinkUpdate' + socket.room);
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
					if (actions.ended) io.to(GEN_CHAT).emit('generalChatUpdate');
					io.to(GAME_CHAT + socket.room).emit('gameChatUpdate');
					io.to(GAME_NAME + socket.room).emit('gameUpdate');
					io.to(LINK_NAME + socket.room).emit('roomLinkUpdate' + socket.room);
					return true;
				}
				return false;
			} catch (err) {
				console.log(err);
			}
		}
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
		.on('shootPlayer', shootPlayer);
};
