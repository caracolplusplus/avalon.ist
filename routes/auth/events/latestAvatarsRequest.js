function latestAvatarsRequest(io, socket) {
  socket.on('avatarsRequest', () => {
    const environment = require('../../constructors/environment').getGlobal();

    socket.emit('avatarsResponse', environment.get('avatarLogs').slice(-3));
  });
}

module.exports = latestAvatarsRequest;
