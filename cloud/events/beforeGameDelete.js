const Environment = require('../../routes/constructors/environment');

const beforeGameSave = async (request) => {
  const environment = Environment.getGlobal();

  environment.checkActiveGames();
};

module.exports = beforeGameSave;
