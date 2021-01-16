module.exports = async (request) => {
  const Environment = require('../../constructors/environment');
  const { object: env, context } = request;

  Environment.setGlobal(env);

  if (context) {
    const { playerList /* roomList, kick, ips */ } = context;

    if (playerList) {
      env.getOnlinePlayers();
    }

    /* if (roomList) {
      const cb = (map) => io.emit('roomListResponse', map);

      env.getActiveGames(cb);
    }

    if (kick === false) {
      env.updateTrees();
    }

    if (kick) {
      env.updateTrees();

      const qMap = ips.map((i) => {
        // eslint-disable-next-line no-undef
        const userQ = new Parse.Query('_User');
        userQ.equalTo('addressList', i);

        return userQ;
      });

      const kickUser = (u) => {
        const username = u.get('username');

        io.to(username).emit('reloadPage');
      };

      // eslint-disable-next-line no-undef
      const mainQuery = Parse.Query.or(...qMap);

      mainQuery
        .find({ useMasterKey: true })
        .then((userList) => {
          userList.forEach(kickUser);
        })
        .catch((e) => console.log(e));
    } */
  }

  return true;
};
