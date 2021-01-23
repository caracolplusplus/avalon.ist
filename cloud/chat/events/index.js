const index = {};

['chatRequest', 'moderationCommands', 'gameCommands', 'messageTo', 'sendTaunt'].forEach(
  (e) => {
    index[e] = require(`./${e}`);
  }
);

module.exports = index;
