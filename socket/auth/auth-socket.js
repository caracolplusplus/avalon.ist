const Parse = require('../parse/parse');
const GeneralChat = require('../chat/general-chat');

var clientsOnline = {};

module.exports = function (io, socket) {
	const GEN_CHAT = 'GeneralChat';

	const parseLink = (input) => {
		socket.join(GEN_CHAT);

		if (input) {
			const query = new Parse.Query('_User');

			query
				.get(input.objectId, {
					useMasterKey: true,
				})
				.then((user) => {
					const username = user.get('username');

					socket.user = user;
					socket.emit('gameUpdate');
					socket.emit('roomListUpdate');

					if (!clientsOnline.hasOwnProperty(username)) {
						clientsOnline[username] = 1;

						GeneralChat.joinLeaveLobby(username, true);
						io.to(GEN_CHAT).emit('generalChatUpdate');
					} else {
						if (clientsOnline[username] <= 0) {
							GeneralChat.joinLeaveLobby(username, true);
							io.to(GEN_CHAT).emit('generalChatUpdate');
						} else {
							socket.emit('generalChatUpdate');
						}

						clientsOnline[username]++;
					}

					clientsOnlineRequest();
				})
				.catch((err) => {
					console.log(err);
				});
		}
	};

	const parseUnlink = () => {
		const user = socket.user;
		socket.leave(GEN_CHAT);

		if (user) {
			const username = user.get('username');

			if (!clientsOnline.hasOwnProperty(username)) {
				clientsOnline[username] = 0;
			} else {
				clientsOnline[username]--;

				if (clientsOnline[username] <= 0) {
					GeneralChat.joinLeaveLobby(username, false);
					io.to(GEN_CHAT).emit('generalChatUpdate');
				}
			}

			clientsOnlineRequest();

			socket.user = null;
		}
	};

	const clientsOnlineRequest = () => {
		var usersOnline = [];

		for (username in clientsOnline) {
			if (clientsOnline[username] > 0) usersOnline.push(username);
		}

		io.emit('clientsOnlineResponse', usersOnline);
	};

	socket
		.emit('connectionStarted')
		.on('parseLink', parseLink)
		.on('parseUnlink', parseUnlink)
		.on('disconnect', parseUnlink)
		.on('clientsOnlineRequest', clientsOnlineRequest);
};
