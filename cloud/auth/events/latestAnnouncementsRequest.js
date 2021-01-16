const Environment = require('../../constructors/environment');

module.exports = async (request) => {
  const environment = Environment.getGlobal();

  return environment.get('announcementLogs').slice(-5);
};
