var Parse = require('parse/node');

Parse.initialize(process.env.APP_ID || 'AVALONIST', 'not_in_use', process.env.MASTER_KEY || 'avalonist_key');
Parse.serverURL = process.env.SERVER_URL || 'http://localhost:1337/parse';

const GlobalEnvironment = Parse.Object.extend('Globals');

const query = new Parse.Query(GlobalEnvironment);
query.equalTo('env', 'Main');

query
	.find({
		useMasterKey: true,
	})
	.then((environmentList) => {
		if (environmentList.length === 0) {
			const mainEnvironment = new GlobalEnvironment();

			mainEnvironment.set('env', 'Main');
			mainEnvironment.set('games', 1);

			mainEnvironment.save(
				{},
				{
					useMasterKey: true,
				}
			);
		} else {
			console.log("Global Environment already exists!");
		}
	})
	.catch((err) => {
		console.log(err);
	});

module.exports = Parse;
