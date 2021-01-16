/* global Parse */
const Events = require('./events');

const {
  getAuthenticated,
  beforeSignup,
  beforeLogin,
  beforeUserSave,
  beforeEnvSave,
  beforeGameSave,
  beforeGameDelete,
} = Events;

Parse.Cloud.define('getAuthenticated', getAuthenticated);
Parse.Cloud.define('beforeSignUp', beforeSignup);

Parse.Cloud.beforeLogin(beforeLogin);

Parse.Cloud.beforeSave(Parse.User, beforeUserSave);
Parse.Cloud.beforeSave('Game', beforeGameSave);

// Parse.Cloud.afterSave(Parse.User, afterUserSave);
Parse.Cloud.afterSave('Environment', beforeEnvSave);
// Parse.Cloud.afterSave('Game', afterGameSave);
// Parse.Cloud.afterSave('Chat', afterChatSave);

Parse.Cloud.beforeDelete('Game', beforeGameDelete);
