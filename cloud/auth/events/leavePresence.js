// Removes user from presence
module.exports = async (request) => {
  const { user } = request;

  if (!user) return;

  const u = await user.fetch({ useMasterKey: true });

  u.leavePresence();

  return true;
};
