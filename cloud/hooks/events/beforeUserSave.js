const Environment = require('../../constructors/environment');

module.exports = async (request) => {
  const environment = await Environment.getGlobal();
  const user = request.object;
  const { context } = request;

  const username = user.get('username');

  const onLockdown = environment.get('onLockdown') || false;

  user.validateLoginData({ onLockdown });

  if (context) {
    const { presence } = context;

    if (presence) {
      setTimeout(async () => {
        const u = await user.fetch({ useMasterKey: true });

        Environment.checkOnlinePlayers();

        if (!u.get('isOnline')) {
          // eslint-disable-next-line no-undef
          const gameQ = new Parse.Query('Game');
          gameQ.equalTo('spectatorListNew', username);

          const gList = await gameQ.find({ useMasterKey: true });

          gList.forEach((g) => g.removeClient({ username }));
        }
      }, 1500);
    }
  }

  return true;
};
