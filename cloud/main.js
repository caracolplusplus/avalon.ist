/* eslint-disable no-undef */
const Events = require('./events');

const {
	linkSocketIO,
	beforeSignup,
	beforeLogin,
	beforeUserSave,
	afterUserSave,
	afterEnvSave,
	afterGameSave,
	afterChatSave,
	beforeGameSave,
} = Events;

Parse.Cloud.define('linkSocketIO', linkSocketIO);
Parse.Cloud.define('beforeSignUp', beforeSignup);

Parse.Cloud.beforeLogin(beforeLogin);

Parse.Cloud.beforeSave(Parse.User, beforeUserSave);
Parse.Cloud.beforeSave('Game', beforeGameSave);

Parse.Cloud.afterSave(Parse.User, afterUserSave);
Parse.Cloud.afterSave('Environment', afterEnvSave);
Parse.Cloud.afterSave('Game', afterGameSave);
Parse.Cloud.afterSave('Chat', afterChatSave);
