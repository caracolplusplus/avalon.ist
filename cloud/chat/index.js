/* global Parse */
const {
  chatRequest,
  messageTo,
  sendTaunt,
  moderationCommands,
  gameCommands,
} = require('./events');

Parse.Cloud.define('chatCommands', async (request) => {
  const { call } = request.params;

  const callList = {
    chatRequest,
    sendTaunt,
    messageTo,
    ...moderationCommands,
    ...gameCommands,
  };

  return await callList[call](request);
});
