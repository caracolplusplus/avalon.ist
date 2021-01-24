module.exports = async (request) => {
  const Environment = require('../../constructors/environment');
  const { object: e, context } = request;

  if (context) {
    const { global, kick, ips } = context;

    if (kick === false) {
      Environment.updateTrees(e);
    }

    if (kick) {
      Environment.updateTrees(e);

      const userQueryMap = ips.map((i) => {
        // eslint-disable-next-line no-undef
        const userQ = new Parse.Query('_User');
        userQ.equalTo('addressList', i);

        return userQ;
      });

      // eslint-disable-next-line no-undef
      const userQ = Parse.Query.or(...userQueryMap);
      userQ.limit(500);

      const userList = await userQ.find({ useMasterKey: true });

      const usernames = userList.map((u) => u.get('username'));

      // eslint-disable-next-line no-undef
      const listsQ = new Parse.Query('Lists');

      const list = await listsQ.first({ useMasterKey: true });

      list.add('globalActions', usernames);
      list.save({}, { useMasterKey: true });
    }

    if (global) {
      // eslint-disable-next-line no-undef
      const listsQ = new Parse.Query('Lists');

      const list = await listsQ.first({ useMasterKey: true });

      list.add('globalActions', ['$maintenance']);
      list.save({}, { useMasterKey: true });
    }

    return true;
  }

  return true;
};
