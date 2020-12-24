function chatRequest(io, socket) {
  socket.on('generalChatRequest', async () => {
    const environment = require('../../constructors/environment').getGlobal();

    const chat = environment.get('chat');

    await chat.fetch({ useMasterKey: true });

    socket.emit('generalChatResponse', chat.get('messages'));
  });

  socket.on('gameChatRequest', async () => {
    const { game } = socket;

    if (!game) return;

    const chat = game.get('chat');

    await chat.fetch({ useMasterKey: true });

    socket.emit('gameChatResponse', chat.get('messages'));
  });
}

module.exports = chatRequest;
