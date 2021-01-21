/* global Parse */

module.exports = async (request) => {
  const { username } = request.params;

  const userQ = new Parse.Query('_User');
  userQ.equalTo('username', username);

  const u = await userQ.first({ useMasterKey: true });

  return u.toProfilePage();
};
