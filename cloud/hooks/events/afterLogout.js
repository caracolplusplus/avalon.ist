module.exports = async (request) => {
  const { object: session } = request;
  const user = session.get('user');

  user.set('instanceCount', 0);
  user.set('isOnline', false);
  user.save(null, { useMasterKey: true });
};
