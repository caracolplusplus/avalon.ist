module.exports = async (request) => {
  const { event } = request;

  if (event === 'ws_disconnect') {
    const { installationId } = request;

    // eslint-disable-next-line no-undef
    const userQ = new Parse.Query('_Session');
    userQ.equalTo('installationId', installationId);

    userQ
      .first({ useMasterKey: true })
      .then((s) => {
        if (s) {
          s.get('user')
            .fetch({ useMasterKey: true })
            .then((u) => {
              console.log(u.get('username'), 'left presence');

              u.leavePresence({ id: installationId });
            });
        }
      })
      .catch((err) => console.log(err));
  }
};
