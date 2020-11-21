const cookie = require('cookie');

const linkSocketIO = async (request) => {
	const { headers } = request;
	const { link, sockets } = require('../../routes/init');

	/* Get IP */
	let address =
		request.headers['X-Forwarded-For'] ||
		request.headers['x-forwarded-for'] ||
		request.connection.remoteAddress ||
		request.socket.remoteAddress;

	if (address.indexOf(',') > -1) {
		address = address.split(',')[0];
	}

	const { user } = request;
	const { io } = cookie.parse(headers.cookie);

	const socket = sockets.find((s) => s.id === io);

	socket.user = user;
	link(socket);

	if (user) {
		user.checkForBans({ address });
	}

	return true;
};

module.exports = linkSocketIO;
