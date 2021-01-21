module.exports = async (request) => {
  // eslint-disable-next-line no-undef
  const annQ = new Parse.Query('Announcement');
  annQ.descending('timestamp');
  annQ.limit(5);

  const annList = await annQ.find({ useMasterKey: true });

  return annList.map((a) => a.toJSON());
};
