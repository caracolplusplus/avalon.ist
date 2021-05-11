module.exports = async (request) => {
  const { user } = request;

  let address = null;
  //get user remote address from request
  try {
    address =
      request.headers['x-forwarded-for'] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      (request.connection.socket ? request.connection.socket.remoteAddress : null);
  //if no remote address take ip from request
  } catch (err) {
    address = request.ip;
  }
  
  if (address.indexOf(',') > -1) {
    address = address.split(',')[0];
  }

  if (!user) return;

  return await user.checkForBans({ address, skip: true });
};
