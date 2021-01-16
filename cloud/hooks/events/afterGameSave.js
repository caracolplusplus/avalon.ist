const { gameRoom } = require('../../rooms');

module.exports = async (request) => {
  const game = request.object;
  const { context } = request;

  if (!game) console.log('hai');

  const { io } = require('../../routes/init');

  const gameId = game.id;
  const code = game.get('code');
  const active = game.get('active');
  const ended = game.get('ended');

  if (!active && !ended) {
    io.to(gameRoom + gameId).emit('gameNotFound');
    return true;
  }

  io.to(gameRoom + gameId).emit('gameResponse', game.toClient());

  const { askForReady, started } = context;

  if (askForReady) {
    io.to(gameRoom + gameId).emit('askForReady');
  }

  if (started) {
    io.to(gameRoom + gameId).emit('printNotification', {
      audio: 'notification',
      title: `Room ${code} has started`,
      body: ``,
    });
  }

  return true;
};
