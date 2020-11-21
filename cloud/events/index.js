const index = {};

[
	'linkSocketIO',
	'beforeSignup',
	'beforeLogin',
	'beforeUserSave',
	'beforeGameSave',
	'afterUserSave',
	'afterEnvSave',
	'afterChatSave',
	'afterGameSave',
].forEach((e) => {
	index[e] = require(`./${e}`);
});

module.exports = index;
