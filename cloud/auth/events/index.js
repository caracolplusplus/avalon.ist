const index = {};

[
  'joinPresence',
  'leavePresence',
  'checkForBans',
  'onDisconnect',
  'playerListRequest',
  'editProfile',
  'getProfile',
  'saveTheme',
  'latestAnnouncementsRequest',
  'latestAvatarsRequest',
  'articleRequest',
  'roomListRequest',
  'themeRequest',
].forEach((e) => {
  index[e] = require(`./${e}`);
});

module.exports = index;
