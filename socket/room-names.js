const generator = require('generate-password');

const passwords = generator.generateMultiple(20, {
    length: 10,
    numbers: true,
    symbols: true,
});

const roomNames = new Set(passwords);
const roomIterator = roomNames.values();

module.exports = {
	GEN_CHAT: roomIterator.next().value,
	GAME_CHAT: roomIterator.next().value,
	GAME_LIST_NAME: roomIterator.next().value,
	GAME_NAME: roomIterator.next().value,
	LINK_NAME: roomIterator.next().value,
}
