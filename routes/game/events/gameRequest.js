const { gameChat, gameRoom } = require('../../rooms');

function gameRequest(io, socket) {
  const { user, id } = socket;
  const username = user.get('username');

  // Leaves game
  const gameLeave = () => {
    // Retrieves game from socket
    const { game } = socket;

    if (!game) return;

    // Fetch from database
    game
      .fetchFromLocalDatastore({ useMasterKey: true })
      .then((g) => {
        // Disconnect socket from listeners
        const gameId = g.id;

        socket.leave(gameRoom + gameId);
        socket.leave(gameChat + gameId);
        socket.off('disconnect', gameLeave);

        // Remove client from room
        g.removeClient({
          username,
          id,
        });
      })
      .catch((err) => console.log(err));

    delete socket.game;
  };

  const findGame = (g) => {
    // Store game in socket
    // Easily accessible for other functions
    socket.game = g;
    const gameId = g.id;

    // If the game is not active and not finished pretend is not found
    if (!g.get('active') && !g.get('ended')) {
      console.log('not active', gameId);
      socket.emit('gameNotFound');
      return;
    }

    // Add client to game
    user
      .fetch({ useMasterKey: true })
      .then((u) => {
        g.addClient(
          {
            username,
            id,
            avatars: u.get('avatars'),
          },
          () => {
            socket
              .emit('gameResponse', g.toClient())
              .join(gameRoom + gameId)
              .join(gameChat + gameId)
              .on('disconnect', gameLeave);
          }
        );
      })
      .catch((err) => console.log(err));
  };

  socket.on('gameRequest', (gameId) => {
    // eslint-disable-next-line no-undef
    const gameQ = new Parse.Query('Game');
    gameQ.fromLocalDatastore();

    // Queries game from database
    gameQ
      .get(gameId, { useMasterKey: true })
      .then(findGame)
      .catch((err) => {
        console.log('searching for replay of', gameId);
        // eslint-disable-next-line no-undef
        const _gameQ = new Parse.Query('Game');
        _gameQ
          .get(gameId, { useMasterKey: true })
          .then((g) => {
            g.pin();

            return g;
          })
          .then(findGame)
          .catch((err) => {
            console.log('game was not found', gameId);
            socket.emit('gameNotFound');
          });
      });
  });

  // Connect game leave
  socket.on('gameLeave', gameLeave);
}

module.exports = gameRequest;
