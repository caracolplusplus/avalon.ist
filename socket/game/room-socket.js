const Parse = require('../parse/parse');
const RoomHandler = require('./room-handler');
const GeneralChat = require('../chat/general-chat');

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

	const roomJoin = (data) => {
		// Data
		// > roomNumber

		socket.join(GAME_NAME + data.roomNumber);
		socket.join(GAME_CHAT + data.roomNumber);
		socket.emit('gameUpdate');

		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(data.roomNumber);

			try {
				const room = handler.getRoom();
				room.chat.onEnter(username, true);

				io.to(GAME_CHAT + data.roomNumber).emit('gameChatUpdate');
			} catch (err) {
				console.log(err);
			}
		}
	};

	const roomLeave = (data) => {
		// Data
		// > roomNumber

		socket.leave(GAME_NAME + data.roomNumber);
		socket.leave(GAME_CHAT + data.roomNumber);

		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler(data.roomNumber);

			try {
				const room = handler.getRoom();
				room.chat.onEnter(username, false);

				io.to(GAME_CHAT + data.roomNumber).emit('gameChatUpdate');
			} catch (err) {
				console.log(err);
			}
		}
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

				const seat = game.players.indexOf(username);

				let response = {
					// Player Info
					username: username,
					players: game.players,
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
