const SocketsOnline = require('../socket/auth/clients-online').sockets;
const GlobalEnvironment = require('../socket/parse/globals');
const IpTree = require('../socket/parse/ip-tree');
const EmailTree = require('../socket/parse/email-tree');

Parse.Cloud.define('authStateChange', async (request) => {
	let currentAddress = request.headers['x-forwarded-for'];

	if (currentAddress.indexOf(',') > -1) {
		currentAddress = currentAddress.split(',')[0];
	}

	const currentUser = request.user;
	const currentId = request.headers.cookie.match(new RegExp('(^| )io=([^;]+)'))[2];

	let currentSocket = undefined;
	let style = undefined;
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
				const main = await GlobalEnvironment();

				if (main.get('adminMode')) {
					throw new Error('Access denied, the server is currently on maintenance');
				}

				if (IpTree.testIp(currentAddress)) {
					throw new Error(
						'Access denied, you are trying to access the site from a blacklisted IP adress. Contact the moderation team if you think this is a mistake.'
					);
				}
			}

			if (currentUser.has('themeLight')) {
				style = {
					playArea: currentUser.get('playArea'),
					playTabs: currentUser.get('playTabs'),
					playFontSize: currentUser.get('playFontSize'),
					avatarSize: currentUser.get('avatarSize'),
					avatarStyle: currentUser.get('avatarStyle'),
					themeLight: currentUser.get('themeLight'),
					coloredNames: currentUser.get('coloredNames'),
				};
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

		currentSocket.emit('connectionLinked', style);
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

	const main = await GlobalEnvironment();

	if (main.get('adminMode')) {
		throw new Error('Access denied, the server is currently on maintenance');
	}

	return true;
});

Parse.Cloud.beforeSave(Parse.User, async (request) => {
	const user = request.object;

	const usernameValidator = /^[0-9a-zA-Z]{3,15}$/;
	const username = user.get('username');
	const email = user.get('email');
	const splitEmail = email.split('@');

	if (!usernameValidator.test(username)) {
		throw new Error(
			'Username must have 3 to 15 characters. The characters must be part of the english alphabet, or be digits from 0 to 9.'
		);
	}

	if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(email)) {
		throw new Error('Email must be in valid email format.');
	}

	if (!EmailTree.test(splitEmail[1])) {
		throw new Error('Email adress is not from a trusted service. Make sure to not use disposable email accounts.');
	}
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

	const main = await GlobalEnvironment();

	if (!currentUser.get('isMod') && !currentUser.get('isAdmin')) {
		if (main.get('adminMode')) {
			throw new Error('Access denied, the server is currently on maintenance');
		}

		if (IpTree.testIp(currentAddress)) {
			throw new Error(
				'Access denied, you are trying to access the site from a blacklisted IP adress. Contact the moderation team if you think this is a mistake.'
			);
		}
	}
});
