const SocketsOnline = require('../socket/auth/clients-online').sockets;
const IpTree = require('../socket/parse/ip-tree');

Parse.Cloud.define('authStateChange', async (request) => {
	let currentAddress = request.headers['x-forwarded-for'];

	if (currentAddress.indexOf(',') > -1) {
		currentAddress = currentAddress.split(',')[0];
	}

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

			if (currentUser.has('isBanned') && currentUser.get('isBanned')) {
				throw new Error('Access denied, your account has been permanently banned.');
			}

			if (currentUser.has('suspensionDate') && currentUser.get('suspensionDate') > Date.now()) {
				throw new Error(
					'Access denied, your account has been temporarily suspended until: ' +
						new Date(currentUser.get('suspensionDate')).toUTCString()
				);
			}

			if (
				currentUser.has('isMod') &&
				currentUser.has('isAdmin') &&
				!currentUser.get('isMod') &&
				!currentUser.get('isAdmin')
			) {
				if (IpTree.testIp(currentAddress)) {
					throw new Error(
						'Access denied, you are trying to access the site from a blacklisted IP adress. Contact the moderation team if you think this is a mistake.'
					);
				}
			}

			const addressList = currentUser.get('ips');

			if (Array.isArray(addressList)) {
				if (!addressList.includes(currentAddress)) addressList.push(currentAddress);

				currentUser.set('ips', addressList);
			} else {
				currentUser.set('ips', [currentAddress]);
			}

			await currentUser.save(null, { useMasterKey: true });

			currentSocket.user = currentUser;
		}

		currentSocket.emit('connectionLinked');
	}

	return true;
});

Parse.Cloud.define('beforeSignUp', async (request) => {
	let currentAddress = request.headers['x-forwarded-for'];

	if (currentAddress.indexOf(',') > -1) {
		currentAddress = currentAddress.split(',')[0];
	}

	if (IpTree.testIp(currentAddress)) {
		throw new Error(
			'Access denied, you are trying to access the site from a blacklisted IP adress. Contact the moderation team if you think this is a mistake.'
		);
	}

	return true;
});

Parse.Cloud.beforeLogin(async (request) => {
	let currentAddress = request.headers['x-forwarded-for'];

	if (currentAddress.indexOf(',') > -1) {
		currentAddress = currentAddress.split(',')[0];
	}

	const currentUser = request.object;

	if (currentUser.get('isBanned')) {
		throw new Error('Access denied, your account has been permanently banned.');
	}

	if (currentUser.get('suspensionDate') > Date.now()) {
		throw new Error(
			'Access denied, your account has been temporarily suspended until: ' +
				new Date(currentUser.get('suspensionDate')).toUTCString()
		);
	}

	if (!currentUser.get('isMod') && !currentUser.get('isAdmin')) {
		if (IpTree.testIp(currentAddress)) {
			throw new Error(
				'Access denied, you are trying to access the site from a blacklisted IP adress. Contact the moderation team if you think this is a mistake.'
			);
		}
	}
});
