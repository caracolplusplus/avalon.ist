var Parse = require("parse/node");

Parse.initialize("AVALONIST", "avalonist_key", "avalonist_key");
Parse.serverURL = "http://localhost:1337/parse";

module.exports = Parse;