const beforeSignup = async (request) => {
	/* Get IP */
	let address =
		request.headers['X-Forwarded-For'] ||
		request.headers['x-forwarded-for'] ||
		request.connection.remoteAddress ||
		request.socket.remoteAddress;

	if (address.indexOf(',') > -1) {
		address = address.split(',')[0];
	}

	const environment = require('../../routes/constructors/environment').getGlobal();

	/* Test if environment allows it */
	environment.validateSignupData({ address });

	return true;
};

module.exports = beforeSignup;
