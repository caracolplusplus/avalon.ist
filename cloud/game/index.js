const { beforeGame, gameRequest, onGame } = require('./events');

// eslint-disable-next-line no-undef
Parse.Cloud.define('gameCommands', async (request) => {
  const { call } = request.params;

  const callList = {
    ...beforeGame,
    ...gameRequest,
    ...onGame,
  };

  return await callList[call](request);
});
