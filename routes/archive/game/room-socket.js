const GlobalEnvironment = require('../parse/globals');
const DiscordReports = require('../parse/discord-webhook');
const RoomHandler = require('./room-handler');
const GeneralChat = require('../chat/general-chat');

const { generalChat, gameChat, gameList, gameRoom } = require('../rooms/defineRoomNames');

module.exports = function (io, socket) {
	const { user } = socket;

	if (!user) return;

	const username = user.get('username');
	const handler = new RoomHandler();

	socket.handler = handler;

	const emissionProtocol = ({ emitRoomList, emitChat, endRoom }) => {
		const { roomName } = handler;

		if (endRoom) {
			io.to(generalChat).emit('generalChatUpdate');
			handler.gameEndProtocol();
		}

		io.to(gameRoom + roomName).emit('gameUpdate');

		if (emitRoomList) io.to(gameList).emit('roomListUpdate');
		if (emitChat) io.to(gameChat + roomName).emit('gameChatUpdate');
	};

	const afterLeave = () => {
		const { roomName } = handler;

		if (roomName !== undefined) {
			try {
				const room = handler.getRoom();
				const { id } = socket;
				const { game, chat } = room;
				const { clients } = game;
				const client = clients[username];

				if (!client) {
					console.log(`${username} asked to leave Room ${room} but request failed.`);
				} else {
					const { sockets } = client;

					const index = sockets.indexOf(id);
					if (index > -1) sockets.splice(index, 1);

					if (sockets.length === 0) {
						const { started, roleSettings, maxPlayers } = game;

						chat.onEnter(username, false);

						// If sockets are empty, then there are no connections for this client,
						// so remove it from the object so we can reap the room. If the client
						// reconnects, they will be readded to the clients objects anyways.
						delete clients[username];

						if (!started) {
							game.switchSeatOnGame(username, false);
							game.setRolesOnGame(roleSettings, maxPlayers);
						}

						emissionProtocol({ emitRoomList: true, emitChat: true, endRoom: false });
					}

					// If no more clients, then delete the room.
					if (Object.keys(clients).length === 0) {
						handler.deleteRoom();
						// Notify other players room has been deleted.
						io.to(gameList).emit('roomListUpdate');
					}

					socket.off('disconnect', afterLeave);
				}

				handler.roomName = undefined;
			} catch (err) {
				console.log(err);
			}
		}
	};

	const roomLeave = () => {
		const { roomName } = handler;

		socket.leave(gameRoom + roomName);
		socket.leave(gameChat + roomName, afterLeave);
	};

	const roomJoin = (r) => {
		const afterJoin = () => {
			try {
				handler.roomName = r;

				const room = handler.getRoom();
				const { id } = socket;
				const { game, chat } = room;
				const { clients } = game;
				const client = clients[username];

				if (!client) {
					clients[username] = {
						timestamp: Date.now(),
						sockets: [id],
					};

					chat.onEnter(username, true);

					emissionProtocol({ emitRoomList: true, emitChat: true, endRoom: false });
				} else if (!client.sockets.includes(socket.id)) {
					const { sockets } = client;

					sockets.push(id);

					socket.emit('gameUpdate');
					socket.emit('gameChatUpdate');
				}

				socket.on('disconnect', afterLeave);
			} catch (err) {
				handler.retrieveFromDatabase(username).then((client) => {
					if (client) {
						handler.roomName = r;

						socket.emit('gameResponse', client);
						socket.emit('gameChatUpdate');
					} else {
						console.log(`No game was found: ID was ${r}`);
						socket.emit('gameNotFound');
					}
				});
			}
		};

		const initialUpdate = () => {
			socket.join(gameChat + r, afterJoin);
		};

		socket.join(gameRoom + r, initialUpdate);
	};

	const gameRequest = async () => {
		try {
			const response = await handler.createRoomClient(username);

			// Send to client
			socket.emit('gameResponse', response);
		} catch (err) {
			console.log(err);
			socket.emit('gameNotFound');
		}
	};

	const createGame = async (data) => {
		const { roleSettings, maxPlayers } = data;

		const main = await GlobalEnvironment();

		const games = main.get('games');
		main.increment('games');

		handler.roomName = games.toString();
		const room = handler.createGame(maxPlayers);
		const { game } = room;

		GeneralChat.roomCreated(username, games);

		game.switchSeatOnGame(username, true);
		game.setRolesOnGame(roleSettings, maxPlayers);

		socket.emit('createGameSuccess', games);

		io.to(generalChat).emit('generalChatUpdate');
		io.to(gameList).emit('roomListUpdate');

		main.save({}, { useMasterKey: true });
	};

	const joinLeaveGame = (data) => {
		const { canSit } = data;

		try {
			const room = handler.getRoom();
			const { game } = room;
			const { started, kickedPlayers, roleSettings, maxPlayers } = game;

			if (started) return false;
			// Kicked players cannot re-join game.
			if (kickedPlayers.has(username)) return false;

			game.switchSeatOnGame(username, canSit);
			game.setRolesOnGame(roleSettings, maxPlayers);
		} catch (err) {
			console.log(err);
		}

		emissionProtocol({ emitRoomList: true, emitChat: true, endRoom: false });
		return true;
	};

	const editGame = (data) => {
		const { roleSettings, maxPlayers } = data;

		try {
			const room = handler.getRoom();
			const { game } = room;
			const { players } = game;

			if (players[0] !== username) return false;

			game.setRolesOnGame(roleSettings, maxPlayers);
		} catch (err) {
			console.log(err);
		}

		emissionProtocol({ emitRoomList: true, emitChat: false, endRoom: false });
		return true;
	};

	const startGame = () => {
		try {
			if (handler.initGame(username)) {
				emissionProtocol({ emitRoomList: true, emitChat: true, endRoom: false });
				return true;
			}

			return false;
		} catch (err) {
			console.log(err);
		}
	};

	const pickTeam = (data) => {
		const { team } = data;

		try {
			const room = handler.getRoom();
			const { game, actions } = room;
			const { players } = game;

			const playerIndex = players.indexOf(username);

			if (playerIndex > -1 && actions.pickTeam(playerIndex, team)) {
				emissionProtocol({ emitRoomList: false, emitChat: true, endRoom: false });
				return true;
			}

			return false;
		} catch (err) {
			console.log(err);
		}
	};

	const voteForMission = (data) => {
		const { vote } = data;

		try {
			const room = handler.getRoom();
			const { game, actions } = room;
			const { players } = game;
			const { ended } = actions;

			const playerIndex = players.indexOf(username);

			if (playerIndex > -1 && actions.voteForMission(playerIndex, vote)) {
				emissionProtocol({ emitRoomList: ended, emitChat: true, endRoom: ended });
				return true;
			}
			return false;
		} catch (err) {
			console.log(err);
		}
	};

	const voteForSuccess = (data) => {
		const { vote } = data;

		try {
			const room = handler.getRoom();
			const { game, actions } = room;
			const { players } = game;
			const { picksYetToVote, ended } = actions;

			const playerIndex = players.indexOf(username);

			if (playerIndex > -1 && actions.voteForSuccess(playerIndex, vote)) {
				emissionProtocol({ emitRoomList: !picksYetToVote.length, emitChat: true, endRoom: ended });
				return true;
			}

			return false;
		} catch (err) {
			console.log(err);
		}
	};

	const cardPlayer = (data) => {
		const { carded } = data;

		try {
			const room = handler.getRoom();
			const { game, actions } = room;
			const { players } = game;
			const { ended } = actions;

			const playerIndex = players.indexOf(username);

			if (playerIndex > -1 && actions.cardPlayer(playerIndex, carded)) {
				emissionProtocol({ emitRoomList: false, emitChat: true, endRoom: ended });
				return true;
			}
			return false;
		} catch (err) {
			console.log(err);
		}
	};

	const shootPlayer = (data) => {
		const { shot } = data;

		try {
			const room = handler.getRoom();
			const { game, actions } = room;
			const { players } = game;
			const { ended } = actions;

			const playerIndex = players.indexOf(username);

			if (playerIndex > -1 && actions.shootPlayer(playerIndex, shot)) {
				emissionProtocol({ emitRoomList: true, emitChat: true, endRoom: ended });
				return true;
			}
			return false;
		} catch (err) {
			console.log(err);
		}
	};

	const kickPlayer = (data) => {
		const { kick } = data;

		try {
			const room = handler.getRoom();
			const { game, chat } = room;
			const {
				players,
				started,
				host,
				kickedPlayers,
				roleSettings,
				maxPlayers,
			} = game;

			// Can't kick people after game starts.
			if (started) return false;
			// Only the host can kick people.
			if (username !== host) return false;
			const playerIndex = players.indexOf(kick);

			if (playerIndex > -1) {
				kickedPlayers.add(kick);
				game.switchSeatOnGame(kick, false);
				game.setRolesOnGame(roleSettings, maxPlayers);
				chat.kickPlayer(host, kick);
				emissionProtocol({ emitRoomList: true, emitChat: true, endRoom: false });

				return true;
			}
		} catch (err) {
			console.log(err);
		}
		return false;
	};

	const reportPlayer = (data) => {
		const { selected, cause, description } = data;

		if (typeof selected === 'string' && typeof cause === 'string' && typeof description === 'string') {
			const { roomName } = handler;
			const room = roomName ? `Room #${roomName}` : 'Lobby';

			try {
				DiscordReports.newReport({ user: username, target: selected, room, cause, description });
				GeneralChat.addModLog({
					action: 'REPORT',
					user: username,
					target: selected,
					motive: cause,
					description: description,
					date: new Date().toUTCString(),
				});
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
		.on('shootPlayer', shootPlayer)
		.on('kickPlayer', kickPlayer)
		.on('reportPlayer', reportPlayer);
};
