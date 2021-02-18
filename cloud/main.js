const { environment } = require('./constructors');
require('./hooks');
require('./auth');
require('./chat');
require('./game');

environment.initialize();
