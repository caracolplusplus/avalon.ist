module.exports = async (request) => {
  // eslint-disable-next-line no-undef
  const avaQ = new Parse.Query('Avatar');
  avaQ.descending('timestamp');
  avaQ.limit(3);

  const avaList = await avaQ.find({ useMasterKey: true });

  return avaList.map((a) => a.toJSON());
};
