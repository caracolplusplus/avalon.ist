const SocketsOnline = require('../socket/auth/clients-online').sockets;

Parse.Cloud.define('authStateChange', async (request) => {
	const currentAddress = request.headers['x-forwarded-for'];

	const currentUser = request.user;
	const currentId = request.headers.cookie.match(new RegExp('(^| )io=([^;]+)'))[2];

	let currentSocket = undefined;

	const l = SocketsOnline.length;

	for (let i = l - 1; i > -1; i--) {
		const s = SocketsOnline[i];

		if (s.id === currentId) {
			currentSocket = s;
			break;
		}
	}

	if (currentSocket) {
		if (currentUser) {
			const currentAcl = new Parse.ACL(currentUser);

			currentUser.setACL(currentAcl);
			currentUser.set('ip', currentAddress);

			await currentUser.save(null, { useMasterKey: true });

			currentSocket.user = currentUser;
		}

		currentSocket.emit('connectionLinked');
	}

	return null;
});

Parse.Cloud.beforeLogin(async (request) => {
	const currentAddress = request.headers['x-forwarded-for'];
	const currentUser = request.object;

	if (currentUser.get('isBanned')) {
		throw new Error('Access denied, your account has been permanently banned.');
	}

	if (currentUser.get('suspensionDate') > Date.now()) {
		throw new Error(
			'Access denied, your account has been temporarily suspended until: ' +
				new Date(user.get('suspensionDate')).toUTCString()
		);
	}
});
