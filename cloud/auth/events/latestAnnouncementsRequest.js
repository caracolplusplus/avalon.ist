const Environment = require('../../constructors/environment');

function latestAnnouncementsRequest(io, socket) {
  socket.on('announcementRequest', () => {
    const environment = Environment.getGlobal();

    socket.emit('announcementResponse', environment.get('announcementLogs').slice(-5));
  });
}

module.exports = latestAnnouncementsRequest;
