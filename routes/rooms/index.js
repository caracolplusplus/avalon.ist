// Declare Modules
const generator = require('generate-password');

// Generates 5 Passwords for socket.io rooms
// This is to prevent users messaging rooms directly
const passwords = generator.generateMultiple(5, {
  length: 10,
  numbers: true,
});

// Defines Room Names
const roomNames = {
  generalChat: passwords[0],
  gameChat: passwords[1],
  gameList: passwords[2],
  gameRoom: passwords[3],
};

module.exports = roomNames;
