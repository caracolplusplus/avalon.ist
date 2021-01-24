module.exports = async (request) => {
  const { object: session } = request;
  const user = session.get('user');

  const u = await user.fetch({ useMasterKey: true });

  u.leavePresence();

  user.save(null, { useMasterKey: true, context: { presence: true } });
};
