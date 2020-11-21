function articleRequest(io, socket) {
	const environment = require('../../constructors/environment').getGlobal();

	socket.on('articleRequest', (data) => {
		const { id } = data;
		const article = environment.get('articles').find((a) => a.id === id);

		article ? socket.emit('articleResponse', article) : socket.emit('articleNotFound');
	});
}

module.exports = articleRequest;