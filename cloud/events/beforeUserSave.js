const beforeUserSave = async (request) => {
	const environment = require('../../routes/constructors/environment').getGlobal();
	const user = request.object;

	user.validateLoginData();
	environment.checkOnlinePlayers({ user });

	return true;
};

module.exports = beforeUserSave;
