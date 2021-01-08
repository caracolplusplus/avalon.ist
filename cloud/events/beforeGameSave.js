const Environment = require('../../routes/constructors/environment');

const beforeGameSave = async (request) => {
  const environment = Environment.getGlobal();

  environment.checkActiveGames();

  return true;
};

module.exports = beforeGameSave;
