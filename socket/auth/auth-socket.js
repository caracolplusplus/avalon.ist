const Parse = require('../parse/parse');
const Profile = require('../profile/profile');
const GeneralChat = require('../chat/general-chat');
const ClientsOnline = require('./clients-online').clients;
const SocketsOnline = require('./clients-online').sockets;

module.exports = function (io, socket) {
	const GEN_CHAT = 'GeneralChat';

	SocketsOnline.push(socket);

	const parseLink = () => {
		const afterJoin = async () => {
			const user = socket.user;

			if (user) {
				const username = user.get('username');

				console.log(username + ' has connected!');

				socket.emit('roomListJoinBack');
				socket.emit('roomJoinBack');

				if (!ClientsOnline.hasOwnProperty(username)) {
					const profile = new Profile(username);

					ClientsOnline[username] = {
						profile: profile,
						sockets: [socket.id],
					};

					await profile.getFromUser();
					profile.saveToUser();

					GeneralChat.joinLeaveLobby(username, true);
					io.to(GEN_CHAT).emit('generalChatUpdate');
				} else if (!ClientsOnline[username].sockets.includes(socket.id)) {
					ClientsOnline[username].sockets.push(socket.id);

					await ClientsOnline[username].profile.getFromUser();
					ClientsOnline[username].profile.saveToUser();

					socket.emit('generalChatUpdate');
				}

				clientsOnlineRequest();
			}
		};

		socket.join(GEN_CHAT, afterJoin);
	};

	const parseUnlink = () => {
		const afterLeave = () => {
			const user = socket.user;

			if (user) {
				try {
					const username = user.get('username');

					console.log(username + ' has disconnected!');

					if (!ClientsOnline.hasOwnProperty(username)) {
						throw new Error('No online client has been found.');
					} else {
						const socketIndex = ClientsOnline[username].sockets.indexOf(socket.id);
						ClientsOnline[username].sockets.splice(socketIndex, 1);
					}

					if (ClientsOnline[username].sockets.length === 0) {
						delete ClientsOnline[username];

						GeneralChat.joinLeaveLobby(username, false);
						io.to(GEN_CHAT).emit('generalChatUpdate');
					}

					clientsOnlineRequest();

					socket.user = null;
				} catch (err) {
					console.log(err);
				}
			}
		};

		socket.leave(GEN_CHAT, afterLeave);
	};

	const removeFromSocketsOnline = () => {
		const i = SocketsOnline.indexOf(socket);
		SocketsOnline.splice(i, 1);
	};

	const filterProfile = (username, profile) => {
		return new Promise((resolve) =>
			resolve({
				username: username,
				rating: profile.gameRating,
				isAdmin: profile.isAdmin,
				isMod: profile.isMod,
				isContrib: profile.isContrib,
			})
		);
	};

	const saveTheme = async (style) => {
		const user = socket.user;

		if (user) {
			try {
				const username = user.get('username');
				const profile = ClientsOnline[username].profile;

				await profile.getFromUser();

				profile.playArea = style.playArea;
				profile.playTabs = style.playTabs;
				profile.playFontSize = style.playFontSize;
				profile.avatarSize = style.avatarSize;
				profile.avatarStyle = style.avatarStyle;
				profile.themeLight = style.themeLight;

				profile.saveToUser();
			} catch (err) {
				console.log(err);
			}
		}
	};

	const clientsOnlineRequest = async () => {
		const usersOnline = [];

		for (username in ClientsOnline) {
			usersOnline.push(filterProfile(username, ClientsOnline[username].profile));
		}

		const result = await Promise.all(usersOnline);

		io.emit('clientsOnlineResponse', result);
	};

	const authStateChange = () => {
		socket.emit('connectionStarted');
	};

	socket
		.emit('connectionStarted')
		.on('saveTheme', saveTheme)
		.on('authStateChange', authStateChange)
		.on('parseLink', parseLink)
		.on('parseUnlink', parseUnlink)
		.on('disconnect', parseUnlink)
		.on('disconnect', removeFromSocketsOnline)
		.on('clientsOnlineRequest', clientsOnlineRequest);
};
