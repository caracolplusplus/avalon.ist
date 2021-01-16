function editProfile(io, socket) {
  const { user } = socket;

  socket.on('editProfile', (data) => {
    user
      .fetch({ useMasterKey: true })
      .then((u) => {
        u.setProfile(data);

        socket.emit('saveProfile', user.toProfilePage());
      })
      .catch((err) => console.log(err));
  });
}

module.exports = editProfile;
