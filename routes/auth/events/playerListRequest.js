const Environment = require('../../constructors/environment');

// Send player list to client
function playerListRequest(io, socket) {
  socket.on('playerListRequest', () => {
    const environment = Environment.getGlobal();

    const cb = (map) => socket.emit('playerListResponse', map);

    environment.getOnlinePlayers(cb);
  });
}

module.exports = playerListRequest;
