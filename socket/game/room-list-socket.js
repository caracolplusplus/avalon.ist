const Parse = require('../parse/parse');
const RoomHandler = require('./room-handler');

module.exports = function (io, socket) {
	const GAME_LIST_NAME = 'RoomList';
	const LINK_NAME = 'RoomLink';

	const roomListJoin = () => {
		// Data

		socket.join(GAME_LIST_NAME);
		socket.emit('roomListUpdate');
	};

	const roomListLeave = () => {
		// Data

		socket.leave(GAME_LIST_NAME);
	};

	const roomLinkJoin = (data) => {
		// Data
		// > roomNumber

		socket.join(LINK_NAME + data.roomNumber);
		socket.emit('roomLinkUpdate' + data.roomNumber);
	};

	const roomLinkLeave = (data) => {
		// Data
		// > roomNumber

		socket.leave(LINK_NAME + data.roomNumber);
	};

	const roomListRequest = () => {
		// Data
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const handler = new RoomHandler('null');

			socket.emit('roomListResponse', handler.getRoomList());
		}
	};

	const roomLinkRequest = (data) => {
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

				for (cli in game.clients) {
					const currentClient = game.clients[cli];

					if (currentClient.sockets.length > 0 || game.players.includes(cli)) spectators++;
				}

				let response = {
					results: [results[0], results[1], results[2], results[3], results[4]],
					avatars: [],
					host: game.host,
					mode: 'UNRATED',
					spectators: spectators - game.players.length,
					gameState: gameState,
				};

				// Send to client
				socket.emit('roomLinkResponse' + data.roomNumber, response);
			} catch (err) {
				console.log(err);
			}
		}
	};

	socket
		.on('roomListJoin', roomListJoin)
		.on('roomListLeave', roomListLeave)
		.on('roomLinkJoin', roomLinkJoin)
		.on('roomLinkLeave', roomLinkLeave)
		.on('roomListRequest', roomListRequest)
		.on('roomLinkRequest', roomLinkRequest);
};
