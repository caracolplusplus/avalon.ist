const index = {};

[
  'avatarAndKnowledgeRepair',
  'cleanAllPresence',
  'deleteGeneralChatAndEmptyGames',
  'logsToObjects',
].forEach((e) => {
  index[e] = require(`./${e}`);
});

module.exports = index;
