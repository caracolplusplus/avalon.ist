const index = {};

[
	'linkSocketIO',
	'beforeSignup',
	'beforeLogin',
	'beforeUserSave',
	'beforeGameSave',
	'afterUserSave',
	'afterEnvSave',
	'afterGameSave',
	'afterChatSave',
].forEach((e) => {
	index[e] = require(`./${e}`);
});

module.exports = index;
