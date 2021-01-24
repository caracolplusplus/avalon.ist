/* global Parse */
const { chatRequest, messageTo, sendTaunt, moderationCommands } = require('./events');
const {
  suspendPlayer,
  revokeSuspension,
  verifyPlayer,
  banPlayer,
  revokeBan,
  banPlayerIP,
  revokeIPBan,
  getLogs,
  toggleLockdown,
  toggleMaintenance,
  newAnnouncement,
  avatarSet,
  requestPasswordReset,
  discordSet,
} = moderationCommands;

Parse.Cloud.define('chatCommands', async (request) => {
  const { call } = request.params;

  const callList = {
    chatRequest,
    sendTaunt,
    messageTo,
    suspendPlayer,
    revokeSuspension,
    verifyPlayer,
    banPlayer,
    revokeBan,
    banPlayerIP,
    revokeIPBan,
    getLogs,
    toggleLockdown,
    toggleMaintenance,
    newAnnouncement,
    avatarSet,
    requestPasswordReset,
    discordSet,
  };

  return await callList[call](request);
});
