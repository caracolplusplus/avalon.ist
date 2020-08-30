var Parse = require('parse/node');

Parse.initialize(process.env.APP_ID || 'AVALONIST', 'not_in_use', process.env.MASTER_KEY || 'avalonist_key');
Parse.serverURL = process.env.SERVER_URL || 'http://localhost:1337/parse';

const GlobalEnvironment = Parse.Object.extend('Globals');

const GlobalQuery = new Parse.Query(GlobalEnvironment);
GlobalQuery.equalTo('env', 'Main');

GlobalQuery.first({
	useMasterKey: true,
})
	.then(() => {
		console.log('Global Environment Already Exists.');
		// Do nothing as Globals exists in the database
	})
	.catch((err) => {
		console.log("Global Environment Doesn't Exist");
		const globals = new GlobalEnvironment();

		globals.set('env', 'Main');
		globals.set('games', 0);

		globals.save();
	});

console.log(Parse.Config.current())

module.exports = Parse;
