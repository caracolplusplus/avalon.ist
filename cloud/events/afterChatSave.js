const { gameChat, generalChat } = require('../../routes/rooms');

const afterChatSave = async (request) => {
	const chat = request.object;

	const { io } = require('../../routes/init');

	const code = chat.get('code');
	const isGeneral = code === 'Global';

	io.to(isGeneral ? generalChat : gameChat + code).emit('gameResponse', chat.get('messages'));

	return true;
};

module.exports = afterChatSave;
