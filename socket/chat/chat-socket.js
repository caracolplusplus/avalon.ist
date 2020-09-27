const Parse = require('../parse/parse');
const RoomHandler = require('../game/room-handler');
const GeneralChat = require('./general-chat');

module.exports = function (io, socket) {
	const GAME_CHAT = 'GameChat';
	const GEN_CHAT = 'GeneralChat';

	const generalChatRequest = () => {
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const result = [];

			const messages = GeneralChat.messages;
			const messagesLength = messages.length;

			for (i = 0; i < messagesLength; i++) {
				const currentMessage = messages[i];
				if (currentMessage.public || currentMessage.to.includes(username)) result.push(currentMessage);
			}

			socket.emit('generalChatResponse', result);
		}
	};

	const gameChatRequest = () => {
		const user = socket.user;

		if (user) {
			try {
				const username = user.get('username');
				const room = new RoomHandler(socket.room).getRoom();
				const result = [];

				const messages = room.chat.messages;
				const messagesLength = messages.length;

				for (i = 0; i < messagesLength; i++) {
					const currentMessage = messages[i];
					if (currentMessage.public || currentMessage.to.includes(username)) result.push(currentMessage);
				}

				socket.emit('gameChatResponse' + socket.room, result);
			} catch (err) {
				const query = new Parse.Query('Game');
				query.equalTo('code', socket.room);

				query
					.first({
						useMasterKey: true,
					})
					.then((game) => {
						if (!game) console.log(err);

						socket.emit('gameChatResponse' + socket.room, game.get('chat'));
					});
			}
		}
	};

	const messageToGeneral = (data) => {
		// Data
		// > content
		const user = socket.user;

		if (user) {
			const username = user.get('username');

			GeneralChat.sendMessage(username, data.content);

			io.to(GEN_CHAT).emit('generalChatUpdate');
		}
	};

	const messageToGame = (data) => {
		// Data
		// > roomNumber
		// > content
		const user = socket.user;

		if (user) {
			try {
				const username = user.get('username');
				const room = new RoomHandler(data.roomNumber).getRoom();

				room.chat.sendMessage(username, data.content);

				io.to(GAME_CHAT + data.roomNumber).emit('gameChatUpdate');
			} catch (err) {
				console.log(err);
			}
		}
	};

	socket
		.on('generalChatRequest', generalChatRequest)
		.on('messageToGeneral', messageToGeneral)
		.on('gameChatRequest', gameChatRequest)
		.on('messageToGame', messageToGame);
};
