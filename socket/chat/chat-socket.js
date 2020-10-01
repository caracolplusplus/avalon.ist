const Parse = require('../parse/parse');
const RoomHandler = require('../game/room-handler');
const ClientsOnline = require('../auth/clients-online').clients;
const GeneralChat = require('./general-chat');

module.exports = function (io, socket) {
	const GAME_CHAT = 'GameChat';
	const GEN_CHAT = 'GeneralChat';

	const generalChatRequest = (id) => {
		const user = socket.user;

		if (user) {
			try {
				const username = user.get('username');
				const profile = ClientsOnline[username].profile;

				const isMod = profile.isMod || profile.isAdmin;
				const result = [];

				const messages = GeneralChat.messages;
				const messagesLength = messages.length;

				for (i = messagesLength - 1; i >= 0; i--) {
					const currentMessage = messages[i];
					if (currentMessage.id <= id) break;
					if (
						currentMessage.public ||
						currentMessage.to.includes(username) ||
						currentMessage.author === username ||
						(isMod && currentMessage.type === 0 && currentMessage.character === 3)
					)
						result.unshift(currentMessage);
				}

				if (result.length > 0) socket.emit('generalChatResponse', result);
			} catch (err) {
				console.log(err);
			}
		}
	};

	const gameChatRequest = (id) => {
		const user = socket.user;

		if (user) {
			try {
				const username = user.get('username');
				const room = new RoomHandler(socket.room).getRoom();
				const profile = ClientsOnline[username].profile;

				const isMod = profile.isMod || profile.isAdmin;
				const result = [];

				const messages = room.chat.messages;
				const messagesLength = messages.length;

				for (i = messagesLength - 1; i >= 0; i--) {
					const currentMessage = messages[i];
					if (currentMessage.id <= id) break;
					if (currentMessage.public || currentMessage.to.includes(username) || currentMessage.author === username)
						result.unshift(currentMessage);
				}

				if (result.length > 0) socket.emit('gameChatResponse' + socket.room, result);
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

	const messageToGeneral = async (data) => {
		// Data
		// > content
		const user = socket.user;

		if (user) {
			const username = user.get('username');
			const quote = /^[0-9]{2}:[0-9]{2} (.*)$/g;

			if (data.content.startsWith('/')) {
				const command = await GeneralChat.parseCommand(username, data.content);

				switch (command.type) {
					default:
						io.to(GEN_CHAT).emit('generalChatUpdate');
						break;
					case 'NONE':
						socket.emit('generalChatUpdate');
						break;
					case 'BAN':
						socket.emit('generalChatUpdate');
						for (const x in command.sockets) {
							const id = command.sockets[x];

							io.to(id).emit('connectionStarted');
						}
						break;
				}
			} else if (quote.test(data.content)) {
				GeneralChat.findQuote(username, data.content);
				io.to(GEN_CHAT).emit('generalChatUpdate');
			} else {
				GeneralChat.sendMessage(username, data.content);
				io.to(GEN_CHAT).emit('generalChatUpdate');
			}
		}
	};

	const messageToGame = async (data) => {
		// Data
		// > roomNumber
		// > content
		const user = socket.user;

		if (user) {
			try {
				const username = user.get('username');
				const room = new RoomHandler(socket.room).getRoom();
				const quote = /^[0-9]{2}:[0-9]{2} (.*)$/g;

				if (data.content.startsWith('/')) {
					const command = await room.chat.parseCommand(username, data.content);

					switch (command.type) {
						default:
							io.to(GAME_CHAT + socket.room).emit('gameChatUpdate');
							break;
						case 'NONE':
							socket.emit('gameChatUpdate');
							break;
						case 'BAN':
							socket.emit('gameChatUpdate');
							for (const x in command.sockets) {
								const id = command.sockets[x];

								io.to(id).emit('connectionStarted');
							}
							break;
					}
				} else if (quote.test(data.content)) {
					room.chat.findQuote(username, data.content);
					io.to(GAME_CHAT + socket.room).emit('gameChatUpdate');
				} else {
					room.chat.sendMessage(username, data.content);
					io.to(GAME_CHAT + socket.room).emit('gameChatUpdate');
				}
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
