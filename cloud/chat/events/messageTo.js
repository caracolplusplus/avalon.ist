/* global Parse */

const Environment = require('../../constructors/environment');

module.exports = async (request) => {
  const { code, messages } = request.params;
  let chat = null;

  if (code) {
    const gameQ = new Parse.Query('Game');

    const game = await gameQ.get(code, { useMasterKey: true });

    chat = game.get('chat');
  } else {
    const env = await Environment.getGlobal();

    chat = env.get('chat');
  }

  chat.saveMessages(messages);

  return 'Message sent';
};
