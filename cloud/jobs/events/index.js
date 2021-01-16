const index = {};

[
  'avatarAndKnowledgeRepair',
  'cleanAllPresence',
  'deleteGeneralChatAndEmptyGames',
].forEach((e) => {
  index[e] = require(`./${e}`);
});

module.exports = index;
