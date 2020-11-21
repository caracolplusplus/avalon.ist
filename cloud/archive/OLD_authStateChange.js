async (request) => {
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
}