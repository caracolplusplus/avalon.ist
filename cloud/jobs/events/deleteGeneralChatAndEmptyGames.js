/* global Parse */

module.exports = (request) => {
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
};
