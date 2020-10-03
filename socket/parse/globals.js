const Parse = require('./parse');

const GlobalEnvironment = async (data) => {
	const query = new Parse.Query('Globals');
	query.equalTo('env', 'Main');

	return await query.first({
		useMasterKey: true,
	});
};

module.exports = GlobalEnvironment;
