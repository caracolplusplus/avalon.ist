function latestAnnouncementsRequest(io, socket) {
	const environment = require('../../constructors/environment').getGlobal();

	socket.on('announcementRequest', () => {
		socket.emit('announcementResponse', environment.get('announcementLogs').slice(-5));
	});
}

module.exports = latestAnnouncementsRequest;