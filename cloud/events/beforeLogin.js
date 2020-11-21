const proxyaddr = require('proxy-addr');

const beforeLogin = async (request) => {
	/* Get IP */
	const trust = function (addr, i) {
		return i < 1;
	};
	const address = proxyaddr(request, trust);

	/* Check Bans */
	const user = request.object;

	user.checkForBans({ address });
	return true;
};

module.exports = beforeLogin;
