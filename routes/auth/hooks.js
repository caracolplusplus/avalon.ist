const {
	joinPresence,
	leavePresence,
	playerListRequest,
	editProfile,
	getProfile,
	saveTheme,
	latestAnnouncementsRequest,
	latestAvatarsRequest,
	articleRequest,
	roomListRequest,
} = require('./events');

const consumer = function (io, socket) {
	const { user } = socket;

	if (user) {
		joinPresence(io, socket);
		leavePresence(io, socket);
		editProfile(io, socket);
		getProfile(io, socket);
		saveTheme(io, socket);
	}

	playerListRequest(io, socket);
	latestAnnouncementsRequest(io, socket);
	latestAvatarsRequest(io, socket);
	articleRequest(io, socket);
	roomListRequest(io, socket);
};

module.exports = consumer;
