module.exports = async (request) => {
  const { url } = request.params;

  // eslint-disable-next-line no-undef
  const annQ = new Parse.Query('Announcement');
  annQ.equalTo('url', url);

  const ann = await annQ.first({ useMasterKey: true });

  if (!ann) return false;

  return ann.toJSON();
};
