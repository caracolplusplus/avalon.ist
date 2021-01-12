/* global Parse */

const afterEnvSave = async (request) => {
  const Environment = require('../../routes/constructors/environment');
  const { object: env, context } = request;

  Environment.setGlobal(env);

  if (context) {
    const { io } = require('../../routes/init');
    const { playerList, roomList, kick, ips } = context;

    if (playerList) {
      const cb = (map) => io.emit('playerListResponse', map);

      env.getOnlinePlayers(cb);
    }

    if (roomList) {
      const cb = (map) => io.emit('roomListResponse', map);

      env.getActiveGames(cb);
    }

    if (kick === false) {
      env.updateTrees();

      console.log('test');
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
    }

    return true;
  }

  return true;
};

module.exports = afterEnvSave;
