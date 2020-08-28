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

					if (!clientsOnline.hasOwnProperty(username)) {
						clientsOnline[username] = 1;
					} else {
						clientsOnline[username]++;
					}

					clientsOnlineRequest();
					GeneralChat.joinLeaveLobby(username, true);

					socket.user = input;
					socket.emit('gameUpdate');
					socket.emit('roomListUpdate');
					io.to(GEN_CHAT).emit('generalChatUpdate');
				})
				.catch((err) => {
					console.log(err);
				});
		}
	};

	const parseUnlink = () => {
		socket.leave(GEN_CHAT);

		if (socket.user) {
			const query = new Parse.Query('_User');

			query
				.get(socket.user.objectId, {
					useMasterKey: true,
				})
				.then((user) => {
					const username = user.get('username');

					if (!clientsOnline.hasOwnProperty(username)) {
						clientsOnline[username] = 0;
					} else {
						clientsOnline[username]--;
					}

					clientsOnlineRequest();
					GeneralChat.joinLeaveLobby(username, false);

					socket.user = null;
					io.to(GEN_CHAT).emit('generalChatUpdate');
				})
				.catch((err) => {
					console.log(err);
				});
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
