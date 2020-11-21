const Parse = require('../parse/parse');
const ClientsOnline = require('../auth/presence').clients;
const GeneralChat = require('./general-chat');

const { generalChat, gameChat, gameList, gameRoom } = require('../rooms/defineRoomNames');

module.exports = function (io, socket) {
	const { user } = socket;

	if (!user) return;

	const username = user.get('username');
	const { profile } = ClientsOnline[username];

	const { handler } = socket;

	const generalChatRequest = (id) => {
		try {
			const isMod = profile.isMod || profile.isAdmin;
			const result = [];

			const { messages } = GeneralChat;
			const { length } = messages;

			for (let i = length - 1; i >= 0; i--) {
				const currentMessage = messages[i];

				if (currentMessage.id <= id) break;

				const { public, to, author, type, character } = currentMessage;

				const forMe = to.includes(username);
				const byMe = author === username;

				const bypassDM = isMod && type === 0 && character === 3;

				if (public || forMe || byMe || bypassDM) result.unshift(currentMessage);
			}

			if (result.length > 0) socket.emit('generalChatResponse', result);
		} catch (err) {
			console.log(err);
		}
	};

	const gameChatRequest = (id) => {
		const user = socket.user;

		if (user) {
			try {
				const room = handler.getRoom();

				const { roomName } = handler;

				const isMod = profile.isMod || profile.isAdmin;
				const result = [];

				const { messages } = room.chat;
				const { length } = messages;

				for (let i = length - 1; i >= 0; i--) {
					const currentMessage = messages[i];

					if (currentMessage.id <= id) break;

					const { public, to, author, type, character } = currentMessage;

					const forMe = to.includes(username);
					const byMe = author === username;

					const bypassDM = isMod && type === 0 && character === 3;

					if (public || forMe || byMe || bypassDM) result.unshift(currentMessage);
				}

				if (result.length > 0) socket.emit('gameChatResponse' + roomName, result);
			} catch (err) {
				const { roomName } = handler;
				const query = new Parse.Query('Game');

				const isMod = profile.isMod || profile.isAdmin;

				query.equalTo('code', roomName);

				const callback = (game) => {
					if (!game) console.log(err);

					const chat = game.get('chat');
					const result = chat.filter(
						(m) =>
							m.public ||
							m.to.includes(username) ||
							m.author === username ||
							(isMod && m.type === 0 && m.character === 3)
					);

					socket.emit('gameChatResponse' + roomName, result);
				};

				query
					.first({
						useMasterKey: true,
					})
					.then(callback);
			}
		}
	};

	const messageInterpreter = async (username, content, chat, room, emission) => {
		const quote = /^[0-9]{2}:[0-9]{2} (.*)$/g;

		if (content.startsWith('/')) {
			const { roomName } = handler;

			const command = await chat.parseCommand(username, content);
			const domain = room === generalChat ? 'Lobby' : `Room #${roomName}`;

			const { type, action, socket, sockets, room: _room, logs } = command;

			const notifs = {
				slapped: 'You must be all dizzy after that slap! \nSuch a violent display...',
				buzzed: 'You have been buzzed. \nPlease pay attention.',
				licked: 'Well, someone has licked you... \nWhatever that means...',
			};

			const message = notifs[action];

			switch (type) {
				case 'DM':
					io.to(room).emit(emission);

					io.to(socket).emit('notificationMessage', {
						audio: 'notification',
						title: `'Message from ${username}.`,
						body: `«${content}»\n\n-${domain}`,
					});

					break;
				case 'BUZZ':
					io.to(room).emit(emission);

					io.to(command.socket).emit('notificationMessage', {
						audio: action,
						title: `'You have been ${action} by ${username}!`,
						body: `«${message}»\n\n-${domain}`,
					});

					break;
				case 'GAME':
					socket.emit(emission);

					io.to(gameList).emit('roomListUpdate');
					io.to(gameRoom + _room).emit('gameUpdate');
					io.to(gameChat + _room).emit('gameChatUpdate');

					break;
				case 'LOGS':
					socket.emit('showModerationLogs', logs);
					socket.emit(emission);

					break;
				case 'NONE':
					socket.emit(emission);
					break;
				case 'BAN':
					socket.emit(emission);

					for (const x in sockets) {
						const id = sockets[x];

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

	const messageToGeneral = async (data) => {
		// Data
		// > content
		const { content } = data;

		messageInterpreter(username, content, GeneralChat, generalChat, 'generalChatUpdate');
	};

	const messageToGame = (data) => {
		// Data
		// > content
		const { content } = data;

		try {
			const room = handler.getRoom();
			const { roomName } = handler;
			const { chat } = room;

			messageInterpreter(username, content, chat, gameChat + roomName, 'gameChatUpdate');
		} catch (err) {
			console.log(err);
		}
	};

	socket
		.on('generalChatRequest', generalChatRequest)
		.on('messageToGeneral', messageToGeneral)
		.on('gameChatRequest', gameChatRequest)
		.on('messageToGame', messageToGame);
};
