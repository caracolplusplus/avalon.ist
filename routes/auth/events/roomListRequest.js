const Environment = require('../../constructors/environment');

function roomListRequest(io, socket) {
  socket.on('roomListRequest', () => {
    const environment = Environment.getGlobal();

    socket.emit('roomListResponse', environment.get('roomList'));
  });
}

module.exports = roomListRequest;
