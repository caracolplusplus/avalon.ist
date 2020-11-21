const index = {};

[
	'joinPresence',
	'leavePresence',
	'playerListRequest',
	'editProfile',
	'getProfile',
	'saveTheme',
	'latestAnnouncementsRequest',
	'latestAvatarsRequest',
	'articleRequest',
	'roomListRequest',
].forEach((e) => {
	index[e] = require(`./${e}`);
});

module.exports = index;