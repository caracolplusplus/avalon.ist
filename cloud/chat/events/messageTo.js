/* global Parse */

const Environment = require('../../constructors/environment');

module.exports = async (request) => {
  const { code, messages } = request.params;
  let chat = null;

  if (code) {
    const gameQ = new Parse.Query('Game');
    gameQ.fromLocalDatastore();

    const game = await gameQ.get(code, { useMasterKey: true });

    chat = game.get('chat');
  } else {
    const env = await Environment.getGlobal();

    chat = env.get('chat');
  }

  chat.saveMessages(messages);

  return 'Message sent';
};

/* function messageTo(io, socket) {
  const getResponse = (isGeneral) => {
    return isGeneral ? 'generalCommandResponse' : 'gameCommandResponse';
  };

  const notifyDM = (message, room) => {
    const { type, from, to, content } = message;

    if (type === 'direct') {
      socket.to(to[0]).emit('printNotification', {
        audio: 'notification',
        title: `New message from ${from} in ${room}`,
        body: `${from} says: "${content}"`,
      });
    }
  };

  socket.on('sendNotification', (data) => {
    const { audio, message: title, target, isGeneral } = data;

    let chat = null;

    if (isGeneral) {
      const environment = Environment.getGlobal();

      chat = environment.get('chat');
    } else {
      const { game } = socket;

      chat = game.get('chat');
    }

    // eslint-disable-next-line no-undef
    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', target);
    userQ.fromLocalDatastore();

    userQ
      .first({
        useMasterKey: true,
      })
      .then((u) => {
        if (u) {
          const cd = u.get('tauntCooldown');

          if (cd > Date.now()) {
            socket.emit(
              getResponse(isGeneral),
              'Wait a couple of seconds before taunting this person again.'
            );
            return;
          }

          socket.to(target).emit('printNotification', {
            audio,
            title,
            body: ``,
          });

          chat.newTaunt({ title, target });

          u.addTaunt();
        } else {
          socket.emit(
            getResponse(isGeneral),
            `There is no user with username "${target}".`
          );
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });

  socket.on('messageToGeneral', (messages) => {
    const environment = Environment.getGlobal();

    const chat = environment.get('chat');
    chat.saveMessages(messages);

    notifyDM(messages[0], 'General');
  });

  socket.on('messageToGame', (messages) => {
    const { game } = socket;

    if (!game) return;

    const chat = game.get('chat');
    const code = game.get('code');
    chat.saveMessages(messages);

    notifyDM(messages[0], `Game #${code}`);
  });
}

module.exports = messageTo; */
