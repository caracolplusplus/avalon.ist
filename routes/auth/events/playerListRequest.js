// Send player list to client
function playerListRequest(io, socket) {
  socket.on('playerListRequest', () => {
    const environment = require('../../constructors/environment').getGlobal();

    const playerList = environment.get('playerList');

    socket.emit('playerListResponse', playerList);
  });
}

module.exports = playerListRequest;
