function saveTheme(io, socket) {
  const { user } = socket;

  socket.on('saveTheme', (style) => {
    user
      .fetch({ useMasterKey: true })
      .then((u) => {
        u.setTheme(style);
      })
      .catch((err) => console.log(err));
  });
}

module.exports = saveTheme;
