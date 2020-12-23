function roomListRequest(io, socket) {
	socket.on('roomListRequest', () => {
		const environment = require('../../constructors/environment').getGlobal();

		socket.emit('roomListResponse', environment.get('roomList'));
	});
}

module.exports = roomListRequest;
