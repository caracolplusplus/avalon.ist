/* global Parse */

const { environment } = require('../../constructors');

module.exports = async (request) => {
  const { code } = request.params;
  let chat = null;

  if (code) {
    const gameQ = new Parse.Query('Game');
    gameQ.fromLocalDatastore();

    const game = await gameQ.get(code, { useMasterKey: true });

    chat = game.get('chat');
  } else {
    const env = environment.getGlobal();

    chat = env.get('chat');
  }

  await chat.fetch({ useMasterKey: true });

  return chat.get('messages');
};
