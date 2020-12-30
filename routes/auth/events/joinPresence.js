// Add user to presence
const { generalChat } = require('../../rooms');

async function joinPresence(io, socket) {
  const { user, id } = socket;

  await user.fetch({ useMasterKey: true });

  user.joinPresence({ id });
  socket.join(generalChat);
  socket.emit('rejoin');
}

module.exports = joinPresence;
