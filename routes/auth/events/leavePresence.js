// Removes user from presence
const { generalChat } = require('../../rooms');

function leavePresence(io, socket) {
	const { user, id } = socket;

	socket.on('disconnect', async () => {
		await user.fetch({ useMasterKey: true });

		user.leavePresence({ id });
		socket.leave(generalChat);
	});
}

module.exports = leavePresence;
