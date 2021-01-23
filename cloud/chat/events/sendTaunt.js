/* global Parse */

const Environment = require('../../constructors/environment');

module.exports = async (request) => {
  console.log('test');

  const { user } = request;
  const { code, to, audio } = request.params;
  let chat = null;

  if (!to) {
    return 'You are not taunting any user.';
  }

  if (!user) return false;

  console.log('uwu');

  const from = user.get('username');

  if (code) {
    const gameQ = new Parse.Query('Game');
    gameQ.fromLocalDatastore();

    const game = await gameQ.get(code, { useMasterKey: true });

    chat = game.get('chat');
  } else {
    const env = await Environment.getGlobal();

    chat = env.get('chat');
  }

  const userQ = new Parse.Query('_User');
  userQ.equalTo('username', to);
  userQ.fromLocalDatastore();

  const target = await userQ.first({ useMasterKey: true });

  if (!target) {
    console.log('hai');

    return `No user found with username "${to}".`;
  }

  if (target.get('tauntCooldown') > Date.now()) {
    return 'Wait a few seconds before taunting this person again.';
  }

  chat.newTaunt({ audio, from, to });
  target.addTaunt();

  return false;
};
