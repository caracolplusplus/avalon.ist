// Create Parse Server
const ParseServer = require('parse-server').ParseServer;

const api = new ParseServer({
  databaseURI: process.env.DATABASE_URI || 'mongodb://localhost:27017/dev2',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'AVALONIST',
  masterKey: process.env.MASTER_KEY || 'avalonist_key',
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',
  liveQuery: {
    classNames: [
      '_User',
      'Game',
      'Chat',
      'Avatar',
      'Announcement',
      'Message',
      'Lists',
      'Taunt',
    ],
    redisURL: 'redis://localhost:6379',
  },
});

// Start Express
const express = require('express');
const path = require('path');
const ms = require('mediaserver');

const app = express();

// Serve React
app.use(express.static('build'));

// Serve Parse API
const mount = process.env.PARSE_MOUNT || '/parse';
app.use(mount, api);

// Routing
app.get('/audio/notification.ogg', (req, res) => {
  ms.pipe(req, res, __dirname + '/audio/notification.ogg');
});

app.get('/audio/slap.ogg', (req, res) => {
  ms.pipe(req, res, __dirname + '/audio/slap.ogg');
});

app.get('/audio/rejected.ogg', (req, res) => {
  ms.pipe(req, res, __dirname + '/audio/rejected.ogg');
});

app.get('/audio/lick.ogg', (req, res) => {
  ms.pipe(req, res, __dirname + '/audio/lick.ogg');
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/build/index.html'));
});

// Set Server and Port
const port = process.env.PORT || 1337;
const server = require('http').createServer(app);

// Listen
server.listen(port, () => {
  console.log(`Avalon.ist running on port ${port}.`);
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(server, {
  redisURL: 'redis://localhost:6379',
});
