const Environment = require('../../constructors/environment');

function latestAvatarsRequest(io, socket) {
  socket.on('avatarsRequest', () => {
    const environment = Environment.getGlobal();

    socket.emit('avatarsResponse', environment.get('avatarLogs').slice(-3));
  });
}

module.exports = latestAvatarsRequest;
