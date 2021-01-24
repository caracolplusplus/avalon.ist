module.exports = async (request) => {
  const { event } = request;

  if (event === 'ws_disconnect') {
    const { sessionToken } = request;

    // eslint-disable-next-line no-undef
    const userQ = new Parse.Query('_Session');
    userQ.equalTo('sessionToken', sessionToken);

    const s = await userQ.first({ useMasterKey: true });

    if (s) {
      const u = await s.get('user').fetch({ useMasterKey: true });
      const username = u.get('username');

      console.log(username, 'left presence');

      u.leavePresence();

      // eslint-disable-next-line no-undef
      const gameQ = new Parse.Query('Game');
      gameQ.equalTo('spectatorListNew', u.get('username'));

      const gList = await gameQ.find({ useMasterKey: true });

      gList.forEach((g) => g.removeClient({ username }));
    }
  }
};
