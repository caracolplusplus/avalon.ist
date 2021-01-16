const index = {};

['chat', 'game', 'user', 'moderation', 'environment'].forEach((e) => {
  index[e] = require(`./${e}`);
});

module.exports = index;
