module.exports = async (request) => {
  const { user, params } = request;
  const { style } = params;

  await user.fetch({ useMasterKey: true });
  user.setTheme(style);
  return true;
};
