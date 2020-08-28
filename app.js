// Declare Modules

const express = require('express');
const ParseServer = require('parse-server').ParseServer;
const path = require('path');
const socketIO = require('socket.io');

const databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
	console.log('Database URI unspecified, falling back to localhost.');
}

const api = new ParseServer({
	databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
	cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
	appId: process.env.APP_ID || 'AVALONIST',
	masterKey: process.env.MASTER_KEY || 'avalonist_key', // Add your master key here. Keep it secret!
	serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse', // Don't forget to change to https if needed
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

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
