const { gameRoom } = require('../../routes/rooms');

const afterGameSave = async (request) => {
  const game = request.object;

  const { io } = require('../../routes/init');

  const code = game.get('code');
  const active = game.get('active');
  const ended = game.get('ended');

  if (!active && !ended) {
    io.to(gameRoom + code).emit('gameNotFound');
    return true;
  }

  io.to(gameRoom + code).emit('gameResponse', game.toClient());
  return true;
};

module.exports = afterGameSave;
