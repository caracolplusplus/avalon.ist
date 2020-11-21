const RoomHandler = require('./room-handler');

const { gameList } = require('../rooms/defineRoomNames');

module.exports = function (io, socket) {
	const { user } = socket;


	if (!user) return;

	const { handler } = socket;


	const roomListJoin = () => {
		// Data

		socket.join(gameList);
		socket.emit('roomListUpdate');
	};

	const roomListLeave = () => {
		// Data

		socket.leave(gameList);
	};

	const roomListRequest = () => {
		// Data
		const user = socket.user;

		if (user) {
			handler.getRoomList().then(list => {
				socket.emit('roomListResponse', list);
			})
		}
	};

	socket
		.on('roomListJoin', roomListJoin)
		.on('roomListLeave', roomListLeave)
		.on('roomListRequest', roomListRequest)
};
