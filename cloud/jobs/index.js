/* global Parse */
const Events = require('./events');

const {
  deleteGeneralChatAndEmptyGames,
  cleanAllPresence,
  avatarAndKnowledgeRepair,
} = Events;

// This function should be run periodically
// It cleans the general chat and it deletes closed games
Parse.Cloud.job('deleteGeneralChatAndEmptyGames', deleteGeneralChatAndEmptyGames);

// This function is ran everytime the server starts
// Allows for clean presence detection
Parse.Cloud.job('cleanAllPresence', cleanAllPresence);

// This function repairs the links in the user's game history after update 16 of January of 2021
// Should only be run once
Parse.Cloud.job('avatarAndKnowledgeRepair', avatarAndKnowledgeRepair);
