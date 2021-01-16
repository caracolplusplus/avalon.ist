function getProfile(io, socket) {
  socket.on('getProfile', (username) => {
    // eslint-disable-next-line no-undef
    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', username);

    userQ.first({ useMasterKey: true }).then((u) => {
      if (u) {
        u.fetch({ useMasterKey: true })
          .then((_u) => socket.emit('saveProfile', _u.toProfilePage()))
          .catch((err) => console.log(err));
      } else {
        socket.emit('profileNotFound');
      }
    });
  });
}

module.exports = getProfile;
