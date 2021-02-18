/* global Parse */
const Events = require('./events');

const {
  getAuthenticated,
  beforeSignup,
  beforeLogin,
  beforeUserSave,
  afterGameSave,
  afterEnvSave,
  afterLogout,
} = Events;

Parse.Cloud.define('getAuthenticated', getAuthenticated);
Parse.Cloud.define('beforeSignUp', beforeSignup);

Parse.Cloud.beforeLogin(beforeLogin);

Parse.Cloud.beforeSave(Parse.User, beforeUserSave);
Parse.Cloud.afterSave('Game', afterGameSave);

Parse.Cloud.afterSave('Environment', afterEnvSave);

Parse.Cloud.afterLogout(afterLogout);
