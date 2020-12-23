const index = {};

['chatRequest', 'moderationCommands', 'gameCommands', 'messageTo'].forEach((e) => {
  index[e] = require(`./${e}`);
});

module.exports = index;
