const index = {};

[
  'getAuthenticated',
  'beforeSignup',
  'beforeLogin',
  'beforeUserSave',
  'afterGameSave',
  'afterEnvSave',
  'afterLogout',
].forEach((e) => {
  index[e] = require(`./${e}`);
});

module.exports = index;
