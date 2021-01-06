const { gameChat, gameRoom } = require('../../rooms');

function gameRequest(io, socket) {
  const { user } = socket;
  const username = user.get('username');

  const gameLeave = async () => {
    const { game } = socket;

    if (!game) return;

    await game.fetch({ useMasterKey: true });

    const code = game.get('code');

    game
      .removeClient({
        username,
      })
      .catch((err) => console.log(err));

    socket.leave(gameRoom + code);
    socket.leave(gameChat + code);
    socket.off('disconnect', gameLeave);

    delete socket.game;
  };

  socket.on('gameRequest', (gameId, code) => {
    // eslint-disable-next-line no-undef
    const gameQ = new Parse.Query('Game');

    gameQ.get(gameId).then(async (g) => {
      if (g) {
        socket.game = g;

        if (!g.get('active') && !g.get('ended')) {
          console.log('not found', g);
          socket.emit('gameNotFound');
          return;
        }

        await user.fetch({ useMasterKey: true });
        await g.fetch({ useMasterKey: true });

        g.addClient({
          username,
          avatars: user.get('avatars'),
        });

        socket
          .join(gameRoom + code)
          .join(gameChat + code)
          .on('disconnect', gameLeave)
          .emit('gameResponse', g.toClient());
      } else {
        socket.emit('gameNotFound');
      }
    });
  });

  socket.on('gameLeave', gameLeave);

  socket.on('roomListRequest', () => {
    const environment = require('../../constructors/environment').getGlobal();

    socket.emit('roomListResponse', environment.get('roomList'));
  });
}

module.exports = gameRequest;
