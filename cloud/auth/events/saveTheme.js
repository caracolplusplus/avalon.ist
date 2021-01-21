module.exports = async (request) => {
  const { user, params } = request;
  const { style } = params;

  user
    .fetchFromLocalDatastore({ useMasterKey: true })
    .then((u) => {
      u.setTheme(style);
    })
    .catch((err) => console.log(err));
};
