/* global Parse */
const { leavePresence, onDisconnect, playerListRequest } = require('./events');

Parse.Cloud.onLiveQueryEvent(onDisconnect);
Parse.Cloud.define('leavePresence', leavePresence);
Parse.Cloud.define('playerListRequest', playerListRequest);
