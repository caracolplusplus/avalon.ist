/* global Parse */

module.exports = (request) => {
  async function cleanUp() {
    const Lists = Parse.Object.extend('Lists');

    const userQ = new Parse.Query('_User');
    userQ.limit(10000);

    const listsQ = new Parse.Query('Lists');

    const lists = (await listsQ.first({ useMasterKey: true })) || new Lists();

    await lists.save({}, { useMasterKey: true });

    userQ
      .find({ useMasterKey: true })
      .then((gList) => {
        gList = gList.map((g) => {
          g.set('instanceCount', 0);

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
};
