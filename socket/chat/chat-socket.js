const Parse = require('../parse/parse');
const RoomHandler = require('../game/room-handler');
const GeneralChat = require('./general-chat');

module.exports = function (io, socket) {
	const GAME_CHAT = 'GameChat';
	const GEN_CHAT = 'GeneralChat';

	const generalChatRequest = () => {
		if (socket.user) {
			const query = new Parse.Query('_User');

			query
				.get(socket.user.objectId, {
					useMasterKey: true,
				})
				.then((user) => {
					const username = user.get('username');

					socket.emit(
						'generalChatResponse',
						GeneralChat.messages.filter((m) => m.public || m.to.includes(username))
					);
				})
				.catch((err) => {
					console.log(err);
				});
		}
	};

	const gameChatRequest = (data) => {
		// Data
		// > roomNumber

		if (socket.user) {
			const query = new Parse.Query('_User');

			query
				.get(socket.user.objectId, {
					useMasterKey: true,
				})
				.then((user) => {
					try {
						const username = user.get('username');
						const room = new RoomHandler(data.roomNumber).getRoom();

						socket.emit(
							'gameChatResponse' + data.roomNumber,
							room.chat.messages.filter((m) => m.public || m.to.includes(username))
						);
					} catch (err) {
						console.log(err);
					}
				})
				.catch((err) => {
					console.log(err);
				});
		}
	};

	const messageToGeneral = (data) => {
		// Data
		// > content

		if (socket.user) {
			const query = new Parse.Query('_User');

			query
				.get(socket.user.objectId, {
					useMasterKey: true,
				})
				.then((user) => {
					const username = user.get('username');

					GeneralChat.sendMessage(username, data.content);

					io.to(GEN_CHAT).emit('generalChatUpdate');
				})
				.catch((err) => {
					console.log(err);
				});
		}
	};

	const messageToGame = (data) => {
		// Data
		// > roomNumber
		// > content

		if (socket.user) {
			const query = new Parse.Query('_User');

			query
				.get(socket.user.objectId, {
					useMasterKey: true,
				})
				.then((user) => {
					try {
						const username = user.get('username');
						const room = new RoomHandler(data.roomNumber).getRoom();

						room.chat.sendMessage(username, data.content);

						io.to(GAME_CHAT + data.roomNumber).emit('gameChatUpdate');
					} catch (err) {
						console.log(err);
					}
				})
				.catch((err) => {
					console.log(err);
				});
		}
	};

	socket
		.on('generalChatRequest', generalChatRequest)
		.on('messageToGeneral', messageToGeneral)
		.on('gameChatRequest', gameChatRequest)
		.on('messageToGame', messageToGame);
};
