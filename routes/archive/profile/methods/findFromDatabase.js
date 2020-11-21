async function findFromDatabase({ callback }) {
  const { user: username } = this;

  const doWithUser = (user) => {
    if (user) {
      return callback(user);
    }

    return undefined;
  };

  const logErr = (err) => console.log(err);

  // eslint-disable-next-line no-undef
  const query = new Parse.Query('_User');
  query.equalTo('username', username);

  return await query.first({ useMasterKey: true }).then(doWithUser).catch(logErr);
}

module.exports = findFromDatabase;
