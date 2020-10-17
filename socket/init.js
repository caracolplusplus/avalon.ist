module.exports = function (io) {
	io.on("connection", (socket) => {
		require('./auth/auth-socket')(io, socket);
		require('./game/room-socket')(io, socket);
		require('./lobby/lobby-socket')(io, socket);
		require('./game/room-list-socket')(io, socket);
		require('./chat/chat-socket')(io, socket);
	});
};
