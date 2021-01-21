/* global Parse */
const {
  leavePresence,
  onDisconnect,
  playerListRequest,
  latestAvatarsRequest,
  latestAnnouncementsRequest,
  getProfile,
  editProfile,
  themeRequest,
  articleRequest,
} = require('./events');

Parse.Cloud.onLiveQueryEvent(onDisconnect);
Parse.Cloud.define('leavePresence', leavePresence);
Parse.Cloud.define('playerListRequest', playerListRequest);
Parse.Cloud.define('latestAvatarsRequest', latestAvatarsRequest);
Parse.Cloud.define('latestAnnouncementsRequest', latestAnnouncementsRequest);
Parse.Cloud.define('getProfile', getProfile);
Parse.Cloud.define('editProfile', editProfile);
Parse.Cloud.define('themeRequest', themeRequest);
Parse.Cloud.define('articleRequest', articleRequest);
