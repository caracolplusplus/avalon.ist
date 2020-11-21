function latestAvatarsRequest(io, socket) {
	const environment = require('../../constructors/environment').getGlobal();

	socket.on('avatarsRequest', () => {
		socket.emit('avatarsResponse', environment.get('avatarLogs').slice(-3));
	});
}

module.exports = latestAvatarsRequest;