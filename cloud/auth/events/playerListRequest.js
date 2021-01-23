/* global Parse */
// Send player list to client
module.exports = async (request) => {
  const listsQ = new Parse.Query('Lists');

  const lists = await listsQ.first({ useMasterKey: true });

  return lists.get('playerList');
};
