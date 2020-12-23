const beforeGameSave = async (request) => {
  const environment = require('../../routes/constructors/environment').getGlobal();

  environment.checkActiveGames();

  return true;
};

module.exports = beforeGameSave;
