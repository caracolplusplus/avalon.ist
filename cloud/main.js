/* global Parse */
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
  beforeGameDelete,
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

Parse.Cloud.beforeDelete('Game', beforeGameDelete);

// This function should be run periodically
// It cleans the general chat and it deletes closed games
Parse.Cloud.job('deleteGeneralChatAndEmptyGames', (request) => {
  function cleanUp() {
    const chatQ = new Parse.Query('Chat');
    chatQ.equalTo('code', 'Global');

    chatQ
      .first({ useMasterKey: true })
      .then((c) => {
        c.set('messages', []);

        c.save({}, { useMasterKey: true });
      })
      .catch((err) => console.log(err));

    const gameQ = new Parse.Query('Game');
    gameQ.equalTo('active', false);
    gameQ.equalTo('ended', false);
    gameQ.limit(10000);

    gameQ
      .find({ useMasterKey: true })
      .then((gList) => {
        gList.forEach((g) => {
          g.get('chat').destroy({ useMasterKey: true });
          g.destroy({ useMasterKey: true });
        });
      })
      .catch((err) => console.log(err));

    const envQ = new Parse.Query('Environment');

    envQ
      .first({ useMasterKey: true })
      .then((e) => {
        e.set('games', 1);

        e.save({}, { useMasterKey: true });
      })
      .catch((err) => console.log(err));
  }

  return cleanUp();
});

// This function repairs the links in the user's game history after update 7 of January of 2021
// Should only be run once
Parse.Cloud.job('repairGameHistory', (request) => {
  // Finds all the users
  function userLinkRepair() {
    const userQ = new Parse.Query('_User');

    userQ.limit(10000);

    // Queries Parse Database
    userQ
      .find({ useMasterKey: true })
      .then((userList) => {
        // For each user
        userList.forEach((u) => {
          // Get username for each user
          const username = u.get('username');
          // Get game history for each user
          let gameHistory = u.get('gameHistory');
          // Slice game history to last 10
          gameHistory = gameHistory.slice(-10);

          // Creates a new game query
          const gameQ = new Parse.Query('Game');
          // For each game with code contained in game history
          gameQ.containedIn('code', gameHistory);
          // Find all
          gameQ
            .find({ useMasterKey: true })
            .then((gameList) => {
              // Map each game for updated game history
              gameHistory = gameList.map((g) => {
                const playerIndex = g.get('playerList').indexOf(username);

                return {
                  code: g.get('code'),
                  id: g.id,
                  role: g.get('roleList')[playerIndex],
                  size: g.get('playerList').length,
                  date: g.get('createdAt'),
                  winner: g.get('winner'),
                };
              });
              // Save new game history to user
              u.set('gameHistory', gameHistory);
              u.save(null, { useMasterKey: true });
            })
            .catch((err) => {
              console.log(err);
            });
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // Repairs Game Chat code for each game
  function gameChatRepair() {
    const gameQ = new Parse.Query('Game');

    gameQ.limit(10000);

    // Queries Parse Database
    gameQ
      .find({ useMasterKey: true })
      .then((gameList) => {
        // For each game
        gameList.forEach((g) => {
          // Get chat
          const chat = g.get('chat');
          // Fetch chat
          chat
            .fetch({ useMasterKey: true })
            .then((c) => {
              // Set chat's code to game id
              c.set('code', g.id);
              // Save chat to database
              c.save({}, { useMasterKey: true });
            })
            .catch((err) => console.log(err));
        });
        // Call user link repair
        userLinkRepair();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  return gameChatRepair(request);
});
