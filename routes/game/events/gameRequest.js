const { gameChat, gameRoom } = require('../../rooms');
const Environment = require('../../constructors/environment');

function gameRequest(io, socket) {
  const { user } = socket;
  const username = user.get('username');

  // Leaves game
  const gameLeave = () => {
    // Retrieves game from socket
    const { game } = socket;

    if (!game) return;

    // Fetch from database
    game
      .fetch({ useMasterKey: true })
      .then((g) => {
        // Disconnect socket from listeners
        const gameId = g.id;

        socket.leave(gameRoom + gameId);
        socket.leave(gameChat + gameId);
        socket.off('disconnect', gameLeave);

        // Remove client from room
        g.removeClient({
          username,
        });
      })
      .catch((err) => console.log(err));

    delete socket.game;
  };

  socket.on('gameRequest', (gameId) => {
    // eslint-disable-next-line no-undef
    const gameQ = new Parse.Query('Game');

    // Queries game from database
    gameQ
      .get(gameId, { useMasterKey: true })
      .then((g) => {
        // Store game in socket
        // Easily accessible for other functions
        socket.game = g;

        // If the game is not active and not finished pretend is not found
        if (!g.get('active') && !g.get('ended')) {
          console.log('not found', gameId);
          socket.emit('gameNotFound');
          return;
        }

        // Add client to game
        user
          .fetch({ useMasterKey: true })
          .then((u) => {
            g.addClient({
              username,
              avatars: u.get('avatars'),
            });
          })
          .catch((err) => console.log(err));

        // Add to socket connections
        socket
          .join(gameRoom + gameId)
          .join(gameChat + gameId)
          .on('disconnect', gameLeave)
          .emit('gameResponse', g.toClient());
      })
      .catch((err) => {
        console.log('not found', gameId);
        socket.emit('gameNotFound');
      });
  });

  // Connect game leave
  socket.on('gameLeave', gameLeave);

  // This gets the room list to the player
  socket.on('roomListRequest', () => {
    const environment = Environment.getGlobal();

    socket.emit('roomListResponse', environment.get('roomList'));
  });
}

module.exports = gameRequest;
