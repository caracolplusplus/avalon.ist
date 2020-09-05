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

	const roomLeavePost = (user, data) => {
		const username = user.get('username');
		const handler = new RoomHandler(data.roomNumber);

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
				io.to(GAME_CHAT + data.roomNumber).emit('gameChatUpdate');
				io.to(LINK_NAME + data.roomNumber).emit('roomLinkUpdate' + data.roomNumber);

				if (!game.started) {
					game.switchSeatOnGame(username, false);
					game.setRolesOnGame(game.roleSettings, game.maxPlayers);
				}

				io.to(GAME_NAME + data.roomNumber).emit('gameUpdate');
			}

			socket.off('disconnect', socket.onLeave);
			delete socket.onLeave;
		} catch (err) {
			console.log(err);
		}
	};

	const roomLeave = (data) => {
		// Data
		// > roomNumber
		const afterLeave = () => {
			const user = socket.user;

			if (user) {
				roomLeavePost(user, data);
			}
		};

		socket.leave(GAME_NAME + data.roomNumber);
		socket.leave(GAME_CHAT + data.roomNumber, afterLeave);
	};

	const roomJoin = (data) => {
		// Data
		// > roomNumber

		const initialUpdate = () => {
			socket.emit('gameUpdate');
			socket.join(GAME_CHAT + data.roomNumber, afterJoin);
		};

		const afterJoin = () => {
			const user = socket.user;

			if (user) {
				const username = user.get('username');
				const handler = new RoomHandler(data.roomNumber);

				try {
					const room = handler.getRoom();
					const game = room.game;
					const chat = room.chat;

					socket.onLeave = () => roomLeavePost(user, data);

					const sendJoinMessage = () => {
						if (game.clients[username].sockets.length === 1) {
							chat.onEnter(username, true);
							io.to(GAME_CHAT + data.roomNumber).emit('gameChatUpdate');
							io.to(LINK_NAME + data.roomNumber).emit('roomLinkUpdate' + data.roomNumber);
							io.to(GAME_NAME + data.roomNumber).emit('gameUpdate');
						} else {
							socket.emit('gameChatUpdate');
						}
					};

					if (!game.clients.hasOwnProperty(username)) {
						const id = ClientsOnline[username].profile.user;
						const profile = new Profile(id);

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

					socket.on('disconnect', socket.onLeave);
				} catch (err) {
					console.log(err);
				}
			}
		};

		socket.join(GAME_NAME + data.roomNumber, initialUpdate);
	};

	const gameRequest = (data) => {
		// Data
		// > roomNumber
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(data.roomNumber);

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
		// > roomNumber
		// > canSit
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(data.roomNumber);

			try {
				const room = handler.getRoom();
				const game = room.game;

				if (game.started) return false;

				game.switchSeatOnGame(username, data.canSit);
				game.setRolesOnGame(game.roleSettings, game.maxPlayers);
			} catch (err) {
				console.log(err);
			}

			io.to(GAME_NAME + data.roomNumber).emit('gameUpdate');
			io.to(LINK_NAME + data.roomNumber).emit('roomLinkUpdate' + data.roomNumber);
			return true;
		}
	};

	const editGame = (data) => {
		// Data
		// > roomNumber
		// > roleSettings
		// > maxPlayers
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(data.roomNumber);

			try {
				const room = handler.getRoom();
				const game = room.game;

				if (game.players[0] !== username) return false;

				game.setRolesOnGame(data.roleSettings, data.maxPlayers);
			} catch (err) {
				console.log(err);
			}

			io.to(GAME_NAME + data.roomNumber).emit('gameUpdate');
			io.to(LINK_NAME + data.roomNumber).emit('roomLinkUpdate' + data.roomNumber);
			return true;
		}
	};

	const startGame = (data) => {
		// Data
		// > roomNumber
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(data.roomNumber);

			try {
				if (handler.initGame(username)) {
					io.to(GAME_CHAT + data.roomNumber).emit('gameChatUpdate');
					io.to(GAME_NAME + data.roomNumber).emit('gameUpdate');
					io.to(LINK_NAME + data.roomNumber).emit('roomLinkUpdate' + data.roomNumber);
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
		// > roomNumber
		// > team
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(data.roomNumber);

			try {
				let room = handler.getRoom();

				let game = room.game;
				let actions = room.actions;
				let missions = room.missions;

				const playerIndex = game.players.indexOf(username);

				if (playerIndex > -1 && playerIndex === actions.leader) {
					if (actions.pickTeam(data.team)) {
						io.to(GAME_CHAT + data.roomNumber).emit('gameChatUpdate');
						io.to(GAME_NAME + data.roomNumber).emit('gameUpdate');
						io.to(LINK_NAME + data.roomNumber).emit('roomLinkUpdate' + data.roomNumber);
						return true;
					}
				}
				return false;
			} catch (err) {
				console.log(err);
			}
		}
	};

	const voteForMission = (data) => {
		// Data
		// > roomNumber
		// > vote
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(data.roomNumber);

			try {
				let room = handler.getRoom();

				let game = room.game;
				let actions = room.actions;
				let missions = room.missions;

				const playerIndex = game.players.indexOf(username);

				if (playerIndex > -1) {
					if (actions.voteForMission(playerIndex, data.vote)) {
						if (actions.ended) io.to(GEN_CHAT).emit('generalChatUpdate');
						io.to(GAME_CHAT + data.roomNumber).emit('gameChatUpdate');
						io.to(GAME_NAME + data.roomNumber).emit('gameUpdate');
						io.to(LINK_NAME + data.roomNumber).emit('roomLinkUpdate' + data.roomNumber);
						return true;
					}
				}
				return false;
			} catch (err) {
				console.log(err);
			}
		}
	};

	const voteForSuccess = (data) => {
		// Data
		// > roomNumber
		// > vote
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(data.roomNumber);

			try {
				let room = handler.getRoom();

				let game = room.game;
				let actions = room.actions;
				let missions = room.missions;

				const playerIndex = game.players.indexOf(username);
				const imRes = ['Resistance', 'Percival'].includes(game.roles[playerIndex]);
				const resVoteIsFail = imRes && data.vote === 0;

				if (playerIndex > -1 && actions.voted.includes(playerIndex) && !resVoteIsFail) {
					if (actions.voteForSuccess(playerIndex, data.vote)) {
						if (actions.ended) io.to(GEN_CHAT).emit('generalChatUpdate');
						io.to(GAME_CHAT + data.roomNumber).emit('gameChatUpdate');
						io.to(GAME_NAME + data.roomNumber).emit('gameUpdate');
						io.to(LINK_NAME + data.roomNumber).emit('roomLinkUpdate' + data.roomNumber);
						return true;
					}
				}
				return false;
			} catch (err) {
				console.log(err);
			}
		}
	};

	const shootPlayer = (data) => {
		// Data
		// > roomNumber
		// > shot
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(data.roomNumber);

			try {
				let room = handler.getRoom();

				let game = room.game;
				let actions = room.actions;
				let missions = room.missions;

				const playerIndex = game.players.indexOf(username);

				if (
					playerIndex > -1 &&
					game.roles[playerIndex] === 'Assassin' &&
					typeof game.roles[data.shot] !== 'undefined'
				) {
					if (actions.shootPlayer(data.shot)) {
						if (actions.ended) io.to(GEN_CHAT).emit('generalChatUpdate');
						io.to(GAME_CHAT + data.roomNumber).emit('gameChatUpdate');
						io.to(GAME_NAME + data.roomNumber).emit('gameUpdate');
						io.to(LINK_NAME + data.roomNumber).emit('roomLinkUpdate' + data.roomNumber);
						return true;
					}
				}
				return false;
			} catch (err) {
				console.log(err);
			}
		}
	};

	const cardPlayer = (data) => {
		// Data
		// > roomNumber
		// > carded
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(data.roomNumber);

			try {
				let room = handler.getRoom();

				let game = room.game;
				let actions = room.actions;
				let missions = room.missions;

				const playerIndex = game.players.indexOf(username);

				if (
					playerIndex > -1 &&
					actions.card === playerIndex &&
					data.carded !== playerIndex &&
					typeof game.roles[data.carded] !== 'undefined'
				) {
					if (actions.cardPlayer(playerIndex, data.carded)) {
						io.to(GAME_CHAT + data.roomNumber).emit('gameChatUpdate');
						io.to(GAME_NAME + data.roomNumber).emit('gameUpdate');
						io.to(LINK_NAME + data.roomNumber).emit('roomLinkUpdate' + data.roomNumber);
						return true;
					}
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
		.on('shootPlayer', shootPlayer)
		.on('cardPlayer', cardPlayer);
};
