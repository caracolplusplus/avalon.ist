const Environment = require('../../constructors/environment');

// Send player list to client
module.exports = async (request) => {
  const environment = Environment.getGlobal();

  return environment.get('playerList');
};
