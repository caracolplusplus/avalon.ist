const index = {};

[
  'joinPresence',
  'leavePresence',
  'onDisconnect',
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
