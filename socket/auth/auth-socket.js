const Parse = require('../parse/parse');
const Profile = require('../profile/profile');
const GeneralChat = require('../chat/general-chat');
const ClientsOnline = require('./clients-online');

module.exports = function (io, socket) {
	const GEN_CHAT = 'GeneralChat';

	const parseLink = (input) => {
		const sendJoinMessage = (username) => {
			if (ClientsOnline[username].sockets.length === 1) {
				GeneralChat.joinLeaveLobby(username, true);
				io.to(GEN_CHAT).emit('generalChatUpdate');
			} else {
				socket.emit('generalChatUpdate');
			}
		};

		const afterJoin = () => {
			if (input) {
				const query = new Parse.Query('_User');

				query
					.get(input.objectId, {
						useMasterKey: true,
					})
					.then(async (user) => {
						const username = user.get('username');

						console.log(username + ' has connected!');

						socket.user = user;
						socket.emit('gameUpdate');
						socket.emit('roomListUpdate');
						socket.emit('roomJoinBack');

						if (!ClientsOnline.hasOwnProperty(username)) {
							const profile = new Profile(username);

							ClientsOnline[username] = {
								profile: profile,
								sockets: [socket.id],
							};

							await profile.getFromUser();
							profile.saveToUser();

							sendJoinMessage(username);
						} else if (!ClientsOnline[username].sockets.includes(socket.id)) {
							ClientsOnline[username].sockets.push(socket.id);
							await ClientsOnline[username].profile.getFromUser();
							ClientsOnline[username].profile.saveToUser();

							sendJoinMessage(username);
						}

						clientsOnlineRequest();
					})
					.catch((err) => {
						console.log(err);
					});
			}
		};

		socket.join(GEN_CHAT, afterJoin);
	};

	const parseUnlink = () => {
		const afterLeave = () => {
			const user = socket.user;

			if (user) {
				const username = user.get('username');

				console.log(username + ' has disconnected!');

				if (!ClientsOnline.hasOwnProperty(username)) {
					console.log('Invalid Request');
				} else {
					const socketIndex = ClientsOnline[username].sockets.indexOf(socket.id);
					ClientsOnline[username].sockets.splice(socketIndex, 1);
				}

				if (ClientsOnline[username].sockets.length === 0) {
					GeneralChat.joinLeaveLobby(username, false);
					io.to(GEN_CHAT).emit('generalChatUpdate');
				}

				clientsOnlineRequest();

				socket.user = null;
			}
		};

		socket.leave(GEN_CHAT, afterLeave);
	};

	const clientsOnlineRequest = () => {
		var usersOnline = [];

		for (username in ClientsOnline) {
			const currentClient = ClientsOnline[username];

			if (currentClient.sockets.length > 0) {
				const currentProfile = currentClient.profile;
				usersOnline.push({
					username: username,
					rating: currentProfile.gameRating,
					isAdmin: currentProfile.isAdmin,
					isMod: currentProfile.isMod,
					isContrib: currentProfile.isContrib,
				});
			}
		}

		io.emit('clientsOnlineResponse', usersOnline);
	};

	const authStateChange = () => {
		socket.emit('connectionStarted');
	};

	socket
		.emit('connectionStarted')
		.on('authStateChange', authStateChange)
		.on('parseLink', parseLink)
		.on('parseUnlink', parseUnlink)
		.on('disconnect', parseUnlink)
		.on('clientsOnlineRequest', clientsOnlineRequest);
};
