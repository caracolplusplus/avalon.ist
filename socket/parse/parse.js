var Parse = require('parse/node');
var IpTree = require('./ip-tree');
var InitialBlacklist = require('./untrusted-ips');

Parse.initialize(process.env.APP_ID || 'AVALONIST', 'not_in_use', process.env.MASTER_KEY || 'avalonist_key');
Parse.serverURL = process.env.SERVER_URL || 'http://localhost:1337/parse';

const GlobalEnvironment = Parse.Object.extend('Globals');

const query = new Parse.Query(GlobalEnvironment);
query.equalTo('env', 'Main');

query
	.first({
		useMasterKey: true,
	})
	.then((mainEnvironment) => {
		if (!mainEnvironment) {
			mainEnvironment = new GlobalEnvironment();

			mainEnvironment.set('env', 'Main');
			mainEnvironment.set('games', 1);
			mainEnvironment.set('ipBlacklist', InitialBlacklist);
			mainEnvironment.set('modLogs', []);

			IpTree.setBlacklistFromArray(InitialBlacklist);

			mainEnvironment.save({}, { useMasterKey: true });
		} else {
			if (!mainEnvironment.has('games')) mainEnvironment.set('games', 1);
			if (!mainEnvironment.has('ipBlacklist')) {
				mainEnvironment.set('ipBlacklist', InitialBlacklist);

				IpTree.setBlacklistFromArray(InitialBlacklist);
			} else {
				const LaterBlacklist = mainEnvironment.get('ipBlacklist');

				IpTree.setBlacklistFromArray(LaterBlacklist);
			}
			if (!mainEnvironment.has('modLogs')) mainEnvironment.set('modLogs', []);

			mainEnvironment.save({}, { useMasterKey: true });
		}
	})
	.catch((err) => {
		console.log(err);
	});

module.exports = Parse;
