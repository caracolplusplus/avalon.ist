module.exports = async (request) => {
  const { params, user } = request;

  if (!user) throw new Error('No user linked with this request.');

  const u = await user.fetch({ useMasterKey: true });

  u.setProfile(params);

  return u.toProfilePage();
};
