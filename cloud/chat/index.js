/* global Parse */
const { chatRequest, messageTo } = require('./events');

Parse.Cloud.define('chatCommands', async (request) => {
  const { call } = request.params;

  const callList = {
    chatRequest,
    messageTo,
  };

  return await callList[call](request);
});
