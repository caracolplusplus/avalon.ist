const { gameChat, generalChat } = require('../../routes/rooms');

const afterChatSave = async (request) => {
  const chat = request.object;
  const { context } = request;

  if (!('messages' in context)) return true;

  const { io } = require('../../routes/init');

  const code = chat.get('code');
  const isGeneral = code === 'Global';

  io.to(isGeneral ? generalChat : gameChat + code).emit(
    isGeneral ? 'generalChatResponse' : 'gameChatResponse',
    context.messages
  );

  return true;
};

module.exports = afterChatSave;
