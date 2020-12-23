const index = {};

['gameRequest', 'beforeGame', 'onGame'].forEach((e) => {
  index[e] = require(`./${e}`);
});

module.exports = index;
