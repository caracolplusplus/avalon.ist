const afterUserSave = async (request) => {
  const user = request.object;

  if ('context' in request) {
    const { context } = request;

    if ('kick' in context) {
      const { kick } = context;

      if (!kick) return true;

      const { io } = require('../../routes/init');

      const username = user.get('username');
      io.to(username).emit('reloadPage');
    }

    if ('another' in context) {
      const { another } = context;
      const { sockets } = require('../../routes/init');

      const socket = sockets.find((s) => s.id === another);

      if (!socket) return;

      const username = user.get('username');
      socket.to(username).emit('anotherDevice');
      socket.join(username);
    }
  }

  return true;
};

module.exports = afterUserSave;
