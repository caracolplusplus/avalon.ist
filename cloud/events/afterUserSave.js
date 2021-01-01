
const afterUserSave = async (request) => {
  const user = request.object;
  const { context } = request;
  
  if (context) {
    const { io, sockets } = require('../../routes/init');
    const { kick, another } = context;

    if (kick) {
      const username = user.get('username');
      io.to(username).emit('reloadPage');
    }

    if (another) {
      const socket = sockets.find((s) => s.id === another);

      if (!socket) return;

      const username = user.get('username');
      socket.to(username).emit('anotherDevice');
      socket.join(username);
    }

    return true;
  }

  return true;
};

module.exports = afterUserSave;
