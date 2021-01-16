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
        gList = gList.map((g) => {
          g.get('chat').destroy({ useMasterKey: true });

          return g;
        });

        Parse.Object.destroyAll(gList, { useMasterKey: true });
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

Parse.Cloud.job('cleanAllPresence', (request) => {
  function cleanUp() {
    const userQ = new Parse.Query('_User');
    userQ.limit(10000);

    userQ
      .find({ useMasterKey: true })
      .then((gList) => {
        gList = gList.map((g) => {
          g.set('instanceList', []);

          return g;
        });

        Parse.Object.saveAll(gList, { useMasterKey: true });
      })
      .catch((err) => console.log(err));

    const gameQ = new Parse.Query('Game');
    gameQ.limit(10000);

    gameQ
      .find({ useMasterKey: true })
      .then((gList) => {
        gList = gList.map((g) => {
          g.set('instanceList', []);

          return g;
        });

        Parse.Object.saveAll(gList, { useMasterKey: true });
      })
      .catch((err) => console.log(err));
  }

  return cleanUp();
});

// This function repairs the links in the user's game history after update 16 of January of 2021
// Should only be run once
Parse.Cloud.job('avatarAndKnowledgeRepair', (request) => {
  // Repairs Game Chat code for each game
  function avatarAndKnowledgeRepair() {
    const gameQ = new Parse.Query('Game');

    gameQ.limit(10000);

    // Queries Parse Database
    gameQ
      .find({ useMasterKey: true })
      .then((gList) => {
        // For each game
        gList = gList.map((g) => {
          const avatarListOld = g.get('avatarList');
          const privateKnowledgeOld = g.get('privateKnowledge');

          g.set('privateKnowledgeNew', []);
          g.set('avatarListNew', []);

          for (const username in avatarListOld) {
            const avatars = avatarListOld[username];

            g.add('avatarListNew', {
              username: username.replace(/\//gi, '.'),
              avatars,
            });
          }

          for (const username in privateKnowledgeOld) {
            const knowledge = privateKnowledgeOld[username];

            g.add('privateKnowledgeNew', {
              username: username.replace(/\//gi, '.'),
              knowledge,
            });
          }

          return g;
        });

        Parse.Object.saveAll(gList, { useMasterKey: true });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  return avatarAndKnowledgeRepair(request);
});
