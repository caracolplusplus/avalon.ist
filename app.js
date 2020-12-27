const d = require('domain').create();

d.on('error', function (err) {
  // Handle errors
  const { message, stack } = err;
  console.log(err);

  const environment = require('./routes/constructors/environment').getGlobal();
  environment.addErrorLog({ message, stack });
});

d.run(function () {
  // Create Parse Server
  const ParseServer = require('parse-server').ParseServer;

  const api = new ParseServer({
    databaseURI: process.env.DATABASE_URI || 'mongodb://localhost:27017/dev2',
    cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
    appId: process.env.APP_ID || 'AVALONIST',
    masterKey: process.env.MASTER_KEY || 'avalonist_key',
    serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',
    logLevel: 'warn',
    /* passwordPolicy: {
      validatorPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{6,})/,
      validationError:
        'Password must have at least 6 characters, with 1 upper case letter and 1 digit.',
      doNotAllowUsername: true,
    }, */
    /* EMAIL VERIFICATION REQUIRES MAILGUN */
  });

  // Start Express
  const express = require('express');
  const path = require('path');
  const ms = require('mediaserver');

  const app = express();

  // Serve React
  app.use(express.static('build'));

  // Add Cookie Parser
  const cookieParser = require('cookie-parser');
  app.use(cookieParser());

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

  // Initialize SocketIO
  const socketIO = require('socket.io');
  const socketRoutes = require('./routes/init');

  const io = socketIO(server);
  socketRoutes.initialize(io);

  // Listen
  server.listen(port, () => {
    console.log(`Avalon.ist running on port ${port}.`);
  });
});
