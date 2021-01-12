const Environment = require('../../constructors/environment');

function roomListRequest(io, socket) {
  socket.on('roomListRequest', () => {
    const environment = Environment.getGlobal();

    const cb = (map) => socket.emit('roomListResponse', map);

    environment.getActiveGames(cb);
  });
}

module.exports = roomListRequest;
