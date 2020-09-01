const Parse = require('../parse/parse');
const GeneralChat = require('../chat/general-chat');

var clientsOnline = {};

module.exports = function (io, socket) {
	const GEN_CHAT = 'GeneralChat';

	const parseLink = (input) => {
		const afterJoin = () => {
			if (input) {
				const query = new Parse.Query('_User');

				query
					.get(input.objectId, {
						useMasterKey: true,
					})
					.then((user) => {
						const username = user.get('username');

						console.log(username + " has connected!");

						socket.user = user;
						socket.emit('gameUpdate');
						socket.emit('roomListUpdate');

						if (!clientsOnline.hasOwnProperty(username)) {
							clientsOnline[username] = [socket.id];
						} else {
							if (!clientsOnline[username].includes(socket.id)) clientsOnline[username].push(socket.id);
						}

						if (clientsOnline[username].length === 1) {
							GeneralChat.joinLeaveLobby(username, true);
							io.to(GEN_CHAT).emit('generalChatUpdate');
						} else {
							socket.emit('generalChatUpdate');
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

				console.log(username + " has disconnected!");

				if (!clientsOnline.hasOwnProperty(username)) {
					console.log('Invalid Request');
				} else {
					clientsOnline[username].splice(clientsOnline[username].indexOf(socket.id), 1);
				}

				if (clientsOnline[username].length === 0) {
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

		for (username in clientsOnline) {
			if (clientsOnline[username] > 0) usersOnline.push(username);
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
