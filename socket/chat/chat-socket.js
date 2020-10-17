const Parse = require('../parse/parse');
const RoomHandler = require('../game/room-handler');
const ClientsOnline = require('../auth/clients-online').clients;
const GeneralChat = require('./general-chat');

const { GEN_CHAT, GAME_CHAT, GAME_LIST_NAME, GAME_NAME } = require('../room-names');

module.exports = function (io, socket) {
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
				const room = new RoomHandler(socket.room).getRoom();
				const username = user.get('username');
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
				const username = user.get('username');
				const client = ClientsOnline[username];

				if (!client) return;

				const profile = client.profile;

				const query = new Parse.Query('Game');

				const isMod = profile.isMod || profile.isAdmin;

				query.equalTo('code', socket.room);

				query
					.first({
						useMasterKey: true,
					})
					.then((game) => {
						if (!game) console.log(err);

						socket.emit(
							'gameChatResponse' + socket.room,
							game
								.get('chat')
								.filter(
									(m) =>
										m.public ||
										m.to.includes(username) ||
										m.author === username ||
										(isMod && m.type === 0 && m.character === 3)
								)
						);
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

			messageInterpreter(username, data.content, GeneralChat, GEN_CHAT, 'generalChatUpdate');
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
				const room = new RoomHandler(socket.room).getRoom();

				messageInterpreter(username, data.content, room.chat, GAME_CHAT + socket.room, 'gameChatUpdate');
			} catch (err) {
				console.log(err);
			}
		}
	};

	const messageInterpreter = async (username, content, chat, room, emission) => {
		const quote = /^[0-9]{2}:[0-9]{2} (.*)$/g;

		if (content.startsWith('/')) {
			const command = await chat.parseCommand(username, content);
			const domain = room === GEN_CHAT ? 'Lobby' : 'Room #' + socket.room;

			switch (command.type) {
				case 'DM':
					io.to(room).emit(emission);

					io.to(command.socket).emit('notificationMessage', {
						audio: 'notification',
						title: 'Message from ' + username,
						body: '«' + command.content + '»' + '\n\n-' + domain,
					});

					break;
				case 'BUZZ':
					io.to(room).emit(emission);

					const message = {
						slapped: 'You must be all dizzy after that slap! \nSuch a violent display...',
						buzzed: 'You have been buzzed. \nPlease pay attention.',
						licked: 'Well, someone has licked you... \nWhatever that means...',
					}[command.action];

					io.to(command.socket).emit('notificationMessage', {
						audio: command.action,
						title: 'You have been ' + command.action + ' by ' + username + '!',
						body: '«' + message + '»' + '\n\n-' + domain,
					});

					break;
				case 'GAME':
					socket.emit(emission);

					io.to(GAME_LIST_NAME).emit('roomListUpdate');
					io.to(GAME_NAME + command.room).emit('gameUpdate');
					io.to(GAME_CHAT + command.room).emit('gameChatUpdate');

					break;
				case 'LOGS':
					socket.emit('showModerationLogs', command.logs);
				case 'NONE':
					socket.emit(emission);
					break;
				case 'BAN':
					socket.emit(emission);

					for (const x in command.sockets) {
						const id = command.sockets[x];

						io.to(id).emit('connectionStarted');
					}

					break;
				case 'RECONNECT':
					socket.emit(emission);

					io.emit('connectionStarted');
			}
		} else if (quote.test(content)) {
			chat.findQuote(username, content);
			io.to(room).emit(emission);
		} else {
			chat.sendMessage(username, content.substr(0, 250).trim());
			io.to(room).emit(emission);
		}
	};

	socket
		.on('generalChatRequest', generalChatRequest)
		.on('messageToGeneral', messageToGeneral)
		.on('gameChatRequest', gameChatRequest)
		.on('messageToGame', messageToGame);
};
