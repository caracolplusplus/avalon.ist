const { environment } = require('./constructors');
require('./hooks');
require('./jobs');
require('./auth');

environment.initialize();
