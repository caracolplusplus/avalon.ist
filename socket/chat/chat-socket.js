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
			}
		} else if (quote.test(content)) {
			chat.findQuote(username, content);
			io.to(room).emit(emission);
		} else {
			chat.sendMessage(username, content);
			io.to(room).emit(emission);
		}
	};

	socket
		.on('generalChatRequest', generalChatRequest)
		.on('messageToGeneral', messageToGeneral)
		.on('gameChatRequest', gameChatRequest)
		.on('messageToGame', messageToGame);
};
