// Loads all the socket.io routes
function defineRoutes(io) {
	require('./constructors/user');
	require('./constructors/environment').initialize();

	const sockets = [];

	io.on('connection', (socket) => {
		sockets.push(socket);

		socket.on('disconnect', (socket) => {
			const i = sockets.indexOf(socket);
			sockets.splice(i, 1);
		});

		socket.emit('getAuthenticated');
	});

	const link = (socket) => {
		require('./auth/hooks')(io, socket);
		// require('./game/hooks')(io, socket);
		// require('./chat/hooks')(io, socket);
	};

	module.exports.io = io;
	module.exports.sockets = sockets;
	module.exports.link = link;
}

module.exports.initialize = defineRoutes;
