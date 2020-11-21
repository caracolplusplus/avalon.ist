function roomListRequest(io, socket) {
	const environment = require('../../constructors/environment').getGlobal();

	socket.on('roomListRequest', () => {
		socket.emit('roomListResponse', environment.get('roomList'));
	});
}

module.exports = roomListRequest;
