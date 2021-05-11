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
  //uwu
  console.log('uwu');

  const from = user.get('username');
  //get chat instance from code
  if (code) {
    const gameQ = new Parse.Query('Game');

    const game = await gameQ.get(code, { useMasterKey: true });

    chat = game.get('chat');
  //if request doesnt have params in it, we get chat from environment
  } else {
    const env = await Environment.getGlobal();

    chat = env.get('chat');
  }

  //find user to taunt
  const userQ = new Parse.Query('_User');
  userQ.equalTo('username', to);
  const target = await userQ.first({ useMasterKey: true });

  if (!target) {
    return `No user found with username "${to}".`;
  }

  if (target.get('tauntCooldown') > Date.now()) {
    return 'Wait a few seconds before taunting this person again.';
  }

  chat.newTaunt({ audio, from, to });
  target.addTaunt();

  return false;
};
