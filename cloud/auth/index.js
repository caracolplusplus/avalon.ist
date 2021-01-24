/* global Parse */
const {
  joinPresence,
  leavePresence,
  onDisconnect,
  playerListRequest,
  roomListRequest,
  latestAvatarsRequest,
  latestAnnouncementsRequest,
  getProfile,
  editProfile,
  saveTheme,
  themeRequest,
  articleRequest,
  checkForBans,
} = require('./events');

Parse.Cloud.define('generalCommands', async (request) => {
  const { call } = request.params;

  const callList = {
    joinPresence,
    leavePresence,
    playerListRequest,
    roomListRequest,
    latestAvatarsRequest,
    latestAnnouncementsRequest,
    getProfile,
    editProfile,
    themeRequest,
    saveTheme,
    articleRequest,
    checkForBans,
  };

  return await callList[call](request);
});

Parse.Cloud.onLiveQueryEvent(onDisconnect);
