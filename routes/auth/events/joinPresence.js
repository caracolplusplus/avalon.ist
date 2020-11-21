// Add user to presence
const { generalChat } = require('../../rooms');

async function joinPresence(io, socket) {
	const { user, id } = socket;

	await user.fetch();

	user.joinPresence({ id });
	socket.join(generalChat);
}

module.exports = joinPresence;
