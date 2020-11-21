const GlobalEnvironment = require('../parse/globals');

module.exports = function (io, socket) {
	const articleRequest = async (id) => {
		const main = await GlobalEnvironment();

		const article = main.get('articles').find((a) => a.id === id);

		article ? socket.emit('articleResponse', article) : socket.emit('articleNotFound');
	};

	const announcementRequest = async () => {
		const main = await GlobalEnvironment();

		socket.emit('announcementResponse', main.get('articles').slice(-5));
	};

	const latestAvatarsRequest = async () => {
		const main = await GlobalEnvironment();

		socket.emit('latestAvatarsResponse', main.get('latestAvatars'));
	};

	socket
		.on('latestAvatarsRequest', latestAvatarsRequest)
		.on('announcementRequest', announcementRequest)
		.on('articleRequest', articleRequest);
};
