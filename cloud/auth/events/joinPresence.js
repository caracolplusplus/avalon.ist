// Add user to presence

module.exports = async (request) => {
  const { user } = request;

  user.joinPresence();
};
