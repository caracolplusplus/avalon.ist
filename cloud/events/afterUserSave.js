const afterUserSave = async (request) => {
  const user = request.object;
  const { context } = request;

  if (context) {
    const { io } = require('../../routes/init');
    const { kick } = context;

    if (kick) {
      const username = user.get('username');
      io.to(username).emit('reloadPage');
    }

    return true;
  }

  return true;
};

module.exports = afterUserSave;
