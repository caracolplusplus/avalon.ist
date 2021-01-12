const Environment = require('../../routes/constructors/environment');

const beforeUserSave = async (request) => {
  const environment = Environment.getGlobal();
  const user = request.object;
  const { context } = request;

  user.validateLoginData();

  if (context) {
    const { presence } = context;

    if (presence) {
      environment.checkOnlinePlayers({ user });
    }
  }

  return true;
};

module.exports = beforeUserSave;
