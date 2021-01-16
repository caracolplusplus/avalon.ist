const { beforeGame, gameRequest, onGame } = require('./events');

const consumer = (io, socket) => {
  const { user } = socket;

  if (user) {
    gameRequest(io, socket);
    beforeGame(io, socket);
    onGame(io, socket);
  }
};

module.exports = consumer;
