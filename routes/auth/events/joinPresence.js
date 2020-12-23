// Add user to presence
const { generalChat } = require('../../rooms');

async function joinPresence(io, socket) {
  const { user, id } = socket;
  const username = user.get('username');

  await user.fetch();

  user.joinPresence({ id });
  socket.join(generalChat);
  socket.join(username);
  socket.emit('rejoin');
}

module.exports = joinPresence;
