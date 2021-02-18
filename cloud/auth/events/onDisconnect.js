module.exports = async (request) => {
  const { event } = request;

  if (event === 'ws_disconnect') {
    const { sessionToken } = request;

    console.log(request);

    // eslint-disable-next-line no-undef
    const sessionQ = new Parse.Query('_Session');
    sessionQ.equalTo('sessionToken', sessionToken);

    const s = await sessionQ.first({ useMasterKey: true });

    if (s) {
      const u = await s.get('user').fetch({ useMasterKey: true });
      console.log('did this!');

      u.leavePresence();
    }
  }
};
