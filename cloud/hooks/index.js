/* global Parse */
const Events = require('./events');

const {
  getAuthenticated,
  beforeSignup,
  beforeLogin,
  beforeUserSave,
  beforeGameSave,
  beforeGameDelete,
  afterEnvSave,
  afterLogout,
} = Events;

Parse.Cloud.define('getAuthenticated', getAuthenticated);
Parse.Cloud.define('beforeSignUp', beforeSignup);

Parse.Cloud.beforeLogin(beforeLogin);

Parse.Cloud.beforeSave(Parse.User, beforeUserSave);
Parse.Cloud.beforeSave('Game', beforeGameSave);

Parse.Cloud.afterSave('Environment', afterEnvSave);
// Parse.Cloud.afterSave(Parse.User, afterUserSave);
// Parse.Cloud.afterSave('Game', afterGameSave);
// Parse.Cloud.afterSave('Chat', afterChatSave);

Parse.Cloud.beforeDelete('Game', beforeGameDelete);

Parse.Cloud.afterLogout(afterLogout);
