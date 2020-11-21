/* This is an example */

const Parse = require('./parse');

const LiveQueryClient = Parse.LiveQueryClient;

const client = new LiveQueryClient({
	applicationId: process.env.APP_ID || 'AVALONIST',
	serverURL: `ws://${Parse.serverURL.split('//')[1]}`,
	javascriptKey: 'not_in_use',
	masterKey: process.env.MASTER_KEY || 'avalonist_key',
});

const test = async () => {
	client.open();

	let query2 = new Parse.Query('Globals'); // Query the object from the database
	let subscription = client.subscribe(query2); // Add the listener

	console.log(subscription);

	subscription.on('update', (object) => {
		console.log('object updated', object);
	});

	console.log('hai!');
};

test();