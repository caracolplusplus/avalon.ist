/* global Parse */
const { chatRequest, messageTo, sendTaunt } = require('./events');

Parse.Cloud.define('chatCommands', async (request) => {
  const { call } = request.params;

  const callList = {
    chatRequest,
    sendTaunt,
    messageTo,
  };

  return await callList[call](request);
});
