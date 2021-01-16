const { gameChat, generalChat } = require('../../rooms');

module.exports = async (request) => {
  const chat = request.object;
  const { context } = request;

  if (context && context.messages) {
    const { io } = require('../../routes/init');

    const game = chat.get('game');

    if (game) {
      io.to(gameChat + game.id).emit('gameChatResponse', context.messages);
    } else {
      io.to(generalChat).emit('generalChatResponse', context.messages);
    }
  }

  return true;
};
