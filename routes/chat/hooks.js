const { messageTo, chatRequest, moderationCommands, gameCommands } = require('./events');

const consumer = (io, socket) => {
  const { user } = socket;

  if (user) {
    chatRequest(io, socket);
    messageTo(io, socket);
    moderationCommands(io, socket);
    gameCommands(io, socket);
  }
};

module.exports = consumer;
