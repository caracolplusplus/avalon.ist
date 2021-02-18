import Parse from 'parse';

const applicationId = 'AVALONIST';
const javascriptKey = 'avalonist_key';

const origin = window.location.hostname;

Parse.initialize(applicationId, javascriptKey);
Parse.serverURL = `http://${origin}:1337/parse`;

const user = Parse.User.current();

// @ts-ignore
const client = new Parse.LiveQueryClient({
  applicationId,
  serverURL: `ws://${origin}:1337/`,
  sessionToken: user ? user.getSessionToken() : undefined,
  javascriptKey,
});
client.open();

export default client;
