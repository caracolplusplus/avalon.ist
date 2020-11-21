const environment = require('../../routes/constructors/environment');

const beforeGameSave = async (request) => {
	environment.checkActiveGames();

	return true;
};

module.exports = beforeGameSave;