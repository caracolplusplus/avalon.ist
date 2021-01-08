const Environment = require('../../constructors/environment');

function chatRequest(io, socket) {
  socket.on('generalChatRequest', () => {
    const environment = Environment.getGlobal();

    const chat = environment.get('chat');

    chat
      .fetch({ useMasterKey: true })
      .then((c) => {
        socket.emit('generalChatResponse', c.get('messages'));
      })
      .catch((err) => console.log(err));
  });

  socket.on('gameChatRequest', () => {
    const { game } = socket;

    if (!game) return;

    game
      .fetch({ useMasterKey: true })
      .then((g) => {
        const chat = g.get('chat');

        chat
          .fetch({ useMasterKey: true })
          .then((c) => {
            socket.emit('gameChatResponse', c.get('messages'));
          })
          .catch((err) => console.log(err));
      })
      .catch((err) => console.log(err));
  });
}

module.exports = chatRequest;
