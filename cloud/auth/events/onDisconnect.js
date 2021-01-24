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

      u.leavePresence();
    }
  }
};
