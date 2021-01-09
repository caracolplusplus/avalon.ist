// Add user to presence
const { generalChat } = require('../../rooms');

function joinPresence(io, socket) {
  const { user, id } = socket;

  user
    .fetch({ useMasterKey: true })
    .then((u) => {
      u.joinPresence({ id });
      socket.join(generalChat);
      socket.emit('rejoin');
    })
    .catch((err) => console.log(err));
}

module.exports = joinPresence;
