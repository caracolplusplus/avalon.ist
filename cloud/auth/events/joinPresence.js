// Add user to presence

module.exports = async (request) => {
  const { user } = request;

  if (!user) return;

  user.joinPresence();
};
