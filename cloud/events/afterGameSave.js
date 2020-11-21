const { gameRoom } = require('../../routes/rooms');

const afterGameSave = async (request) => {
	const game = request.object;

	const { io } = require('../../routes/init');

	const code = game.get('code');

	io.to(gameRoom + code).emit('gameResponse', game.toClient());

	return true;
};

module.exports = afterGameSave;
