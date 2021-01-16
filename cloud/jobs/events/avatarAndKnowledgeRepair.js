/* global Parse */

module.exports = (request) => {
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
};
