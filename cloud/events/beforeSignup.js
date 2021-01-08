const Environment = require('../../routes/constructors/environment');

const beforeSignup = async (request) => {
  /* Get IP */
  let address = null;

  try {
    address =
      request.headers['x-forwarded-for'] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      (request.connection.socket ? request.connection.socket.remoteAddress : null);
  } catch (err) {
    address = request.ip;
  }

  if (address.indexOf(',') > -1) {
    address = address.split(',')[0];
  }

  const environment = Environment.getGlobal();

  /* Test if environment allows it */
  environment.validateSignupData({ address });

  return true;
};

module.exports = beforeSignup;
