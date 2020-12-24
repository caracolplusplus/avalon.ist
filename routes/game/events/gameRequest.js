const { generalChat, gameChat, gameRoom } = require('../../rooms');

function gameRequest(io, socket) {
  const { user, id } = socket;
  const username = user.get('username');

  const gameLeave = async () => {
    const { game, id } = socket;

    if (!game) return;

    await game.fetch({ useMasterKey: true });

    const code = game.get('code');

    game.removeClient({
      username,
      instance: id,
      id: generalChat,
    });

    socket.leave(gameRoom + code);
    socket.leave(gameChat + code);
    socket.off('disconnect', gameLeave);

    delete socket.game;
  };

  socket.on('gameRequest', (code) => {
    // eslint-disable-next-line no-undef
    const gameQ = new Parse.Query('Game');
    gameQ.equalTo('code', code);

    gameQ.first({ useMasterKey: true }).then(async (g) => {
      if (g) {
        socket.game = g;

        if (!g.get('active') && !g.get('ended')) {
          socket.emit('gameNotFound');
          return;
        }

        await user.fetch({ useMasterKey: true });
        await g.fetch({ useMasterKey: true });

        g.addClient({
          username,
          avatars: user.get('avatars'),
          instance: id,
          id: generalChat,
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
