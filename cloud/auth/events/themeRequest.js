module.exports = async (request) => {
  const { user } = request;

  if (!user) return false;

  return user.toStyle();
};
