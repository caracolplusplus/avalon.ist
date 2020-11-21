// Send player list to client
function playerListRequest(io, socket) {
	const environment = require('../../constructors/environment').getGlobal();

	socket.on('playerListRequest', () => {
		const playerList = environment.get('playerList');

		socket.emit('playerListResponse', playerList);
	});
}

module.exports = playerListRequest;
