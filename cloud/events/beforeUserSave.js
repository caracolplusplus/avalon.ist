const Environment = require('../../routes/constructors/environment');

const beforeUserSave = async (request) => {
  const environment = Environment.getGlobal();
  const user = request.object;

  user.validateLoginData();
  environment.checkOnlinePlayers({ user });

  return true;
};

module.exports = beforeUserSave;
