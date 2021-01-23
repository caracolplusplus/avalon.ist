const Environment = require('../../constructors/environment');

module.exports = async (request) => {
  const game = request.object;

  Environment.checkActiveGames({ game, beforeSave: true });

  return true;
};
