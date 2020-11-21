// Create Parse Server
const ParseServer = require('parse-server').ParseServer;

const api = new ParseServer({
	databaseURI: process.env.DATABASE_URI || 'mongodb://localhost:27017/dev',
	cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
	appId: process.env.APP_ID || 'AVALONIST',
	masterKey: process.env.MASTER_KEY || 'avalonist_key',
	serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',
	logLevel: 'warn',
	passwordPolicy: {
		validatorPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{6,})/,
		validationError: 'Password must have at least 6 characters, with 1 upper case letter and 1 digit.',
		doNotAllowUsername: true,
	},
});

// Start Express
const express = require('express');
const path = require('path');

const app = express();

// Serve React
app.use(express.static('build'));

// Serve Parse API
const mount = process.env.PARSE_MOUNT || '/parse';
app.use(mount, api);

// Routing
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname + '/build/index.html'));
});

// Set Server and Port
const port = process.env.PORT || 1337;
const server = require('http').createServer(app);

// Initialize SocketIO
const socketIO = require('socket.io');
const socketRoutes = require('./routes/init');

const io = socketIO(server);
socketRoutes.initialize(io);

// Listen
server.listen(port, () => {
	console.log(`Avalon.ist running on port ${port}.`);
});

// Graceful Shutdown
const terminate = require('./routes/terminate');

const exitHandler = terminate(server, {
	coredump: false,
	timeout: 500,
});

process.on('uncaughtException', exitHandler(1, 'Unexpected Error'));
process.on('unhandledRejection', exitHandler(1, 'Unhandled Promise'));
process.on('SIGTERM', exitHandler(0, 'SIGTERM'));
process.on('SIGINT', exitHandler(0, 'SIGINT'));
