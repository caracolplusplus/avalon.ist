/* global Parse */
const {
  leavePresence,
  onDisconnect,
  playerListRequest,
  latestAvatarsRequest,
  latestAnnouncementsRequest,
  getProfile,
  editProfile,
  saveTheme,
  themeRequest,
  articleRequest,
} = require('./events');

Parse.Cloud.define('generalCommands', async (request) => {
  const { call } = request.params;

  const callList = {
    leavePresence,
    playerListRequest,
    latestAvatarsRequest,
    latestAnnouncementsRequest,
    getProfile,
    editProfile,
    themeRequest,
    saveTheme,
    articleRequest,
  };

  return await callList[call](request);
});

Parse.Cloud.onLiveQueryEvent(onDisconnect);
