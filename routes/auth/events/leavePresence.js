// Removes user from presence
const { generalChat } = require('../../rooms');

function leavePresence(io, socket) {
  const { user, id } = socket;

  socket.on('disconnect', () => {
    user
      .fetch({ useMasterKey: true })
      .then((u) => {
        if (u.get('lastInstance') === id) {
          u.leavePresence();
        }
      })
      .catch((err) => console.log(err));

    socket.leave(generalChat);
  });
}

module.exports = leavePresence;
