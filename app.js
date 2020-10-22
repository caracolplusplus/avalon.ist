// Declare Modules

const express = require('express');
const ParseServer = require('parse-server').ParseServer;
const path = require('path');
const socketIO = require('socket.io');

// Start Parse Server
const api = new ParseServer({
	databaseURI: process.env.DATABASE_URI || 'mongodb://localhost:27017/dev',
	cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
	appId: process.env.APP_ID || 'AVALONIST',
	masterKey: process.env.MASTER_KEY || 'avalonist_key',
	serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',
	passwordPolicy: {
		validatorPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{6,})/,
		validationError: 'Password must have at least 6 characters, with 1 upper case letter and 1 digit.',
		doNotAllowUsername: true,
	},
	liveQuery: {
		classNames: ['Globals'], // List of classes to support for query subscriptions
	},
});

const app = express();

// Serve React
app.use(express.static('build'));

// Serve Parse API
const mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Routing
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname + '/build/index.html'));
});

// Set Server and Port
const port = process.env.PORT || 1337;
const server = require('http').createServer(app);

// Initialize SocketIO
const io = socketIO(server);
require('./socket/init')(io);

// Listen
server.listen(port, () => {
	console.log('Avalon.ist running on port ' + port + '.');
});

// Initialize Parse LiveQuery
ParseServer.createLiveQueryServer(server);
