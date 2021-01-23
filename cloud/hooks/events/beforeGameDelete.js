const Environment = require('../../constructors/environment');

module.exports = async (request) => {
  const game = request.object;
  const environment = await Environment.getGlobal();

  environment.checkActiveGames({ game, beforeSave: false });
};