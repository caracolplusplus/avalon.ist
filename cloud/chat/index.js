/* global Parse */
const { chatRequest, messageTo } = require('./events');

Parse.Cloud.define('chatRequest', chatRequest);
Parse.Cloud.define('messageTo', messageTo);
