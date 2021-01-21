// Removes user from presence
module.exports = async (request) => {
  const { user } = request;

  if (!user) return;

  console.log(user.get('username'), 'left presence');
  user.leavePresence({ id: request.installationId });

  return true;
};
