const { environment } = require('./constructors');
require('./hooks');
require('./jobs');
require('./auth');
require('./chat');
require('./game');

environment.initialize();
