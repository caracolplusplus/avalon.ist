/* global Parse */
module.exports = async (request) => {
  const { user } = request;
  const { code } = request.params;

  if (!user) return;

  const username = user.get('username');

  const publicMessages = new Parse.Query('Message');
  publicMessages.equalTo('public', true);

  const myMessages = new Parse.Query('Message');
  myMessages.equalTo('from', username);

  const messagesDirectedToMe = new Parse.Query('Message');
  messagesDirectedToMe.equalTo('to', username);

  const messageQ = Parse.Query.or(publicMessages, myMessages, messagesDirectedToMe);

  if (code) {
    messageQ.equalTo('code', code);
    messageQ.limit(1000);
  } else {
    messageQ.equalTo('global', true);
    messageQ.limit(30);
  }

  messageQ.descending('realtime');

  const messages = await messageQ.find({ useMasterKey: true });

  if (!messages.length) return [];

  return messages.reverse().map((m) => m.toJSON());
};
