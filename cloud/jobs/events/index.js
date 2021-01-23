const index = {};

[
  'avatarAndKnowledgeRepair',
  'cleanAllPresence',
  'deleteGeneralChatAndEmptyGames',
  'logsToObjects',
  'setSchemas',
  'chatMessagesToObjects',
].forEach((e) => {
  index[e] = require(`./${e}`);
});

module.exports = index;
