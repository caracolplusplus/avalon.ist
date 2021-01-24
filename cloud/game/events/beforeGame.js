const Game = require('../../constructors/game');
const Environment = require('../../constructors/environment');

const createGame = async (request) => {
  const { user } = request;

  if (!user) return false;

  const username = user.get('username');

  // Gets data from client
  const { roleSettings, playerMax, listed } = request.params;

  // Gets environment global variables
  const environment = await Environment.getGlobal();

  // Gets the game count of session variable
  environment.increment('games');

  const e = await environment.save({}, { useMasterKey: true });

  const code = e.get('games').toString();

  // Creates the game object
  const game = Game.spawn({ code });
  game.set('listed', listed);

  // Set initial game settings
  game.editSettings({ roleSettings, playerMax });

  await game.save({}, { useMasterKey: true });

  await game.pin();
  // Build chat
  game.buildChat();
  // Toggle seat for this player
  game.togglePlayer({ username, add: true });

  // Gets the general chat from environment
  const chat = e.get('chat');

  const c = await chat.fetch({ useMasterKey: true });
  // Sends message to general chat
  // Room was created
  c.roomCreated({ username, code });

  return game.id;
};

const reportPlayer = async (request) => {
  const { user } = request;

  if (!user) return false;

  const username = user.get('username');

  const { id, selected, cause, description } = request.params;

  // eslint-disable-next-line no-undef
  const gameQ = new Parse.Query('Game');
  gameQ.fromLocalDatastore();

  const game = await gameQ.get(id, { useMasterKey: true });

  // If no game dont perform operation
  if (!game) return;

  // Ask for discord webhook
  const DiscordReports = require('../../security/discordReports');

  // Adds report
  DiscordReports.newReport({
    user: username,
    target: selected,
    room: game.get('code'),
    motive: cause,
    description,
  });

  return true;
};

const editGame = async (request) => {
  const { user } = request;

  if (!user) return false;

  const { id, roleSettings, playerMax } = request.params;

  // eslint-disable-next-line no-undef
  const gameQ = new Parse.Query('Game');
  gameQ.fromLocalDatastore();

  const game = await gameQ.get(id, { useMasterKey: true });

  // If no game dont perform operation
  if (!game) return;

  // Edit settings
  game.editSettings({ roleSettings, playerMax });
  // Save settings
  game.save({}, { useMasterKey: true });

  return true;
};

const joinLeaveGame = async (request) => {
  const { user } = request;

  if (!user) return false;

  const username = user.get('username');

  const { id } = request.params;

  // eslint-disable-next-line no-undef
  const gameQ = new Parse.Query('Game');
  gameQ.fromLocalDatastore();

  const game = await gameQ.get(id, { useMasterKey: true });

  // If no game dont perform operation
  if (!game) return;

  // Sit or stand up
  game.togglePlayer({ username, add: true });

  return true;
};

const toggleClaim = async (request) => {
  const { user } = request;

  if (!user) return false;

  const username = user.get('username');

  const { id } = request.params;

  // eslint-disable-next-line no-undef
  const gameQ = new Parse.Query('Game');
  gameQ.fromLocalDatastore();

  const game = await gameQ.get(id, { useMasterKey: true });

  // If no game dont perform operation
  if (!game) return;

  // Toggle the claim symbol for this player
  game.toggleClaim(username);

  return true;
};

const kickPlayer = async (request) => {
  const { user } = request;

  if (!user) return false;

  const { id, kick } = request.params;

  // eslint-disable-next-line no-undef
  const gameQ = new Parse.Query('Game');
  gameQ.fromLocalDatastore();

  const game = await gameQ.get(id, { useMasterKey: true });

  // If no game dont perform operation
  if (!game) return;

  // Kick player
  game.addToKick({ kick });

  return true;
};

const startGame = async (request) => {
  const { user } = request;

  if (!user) return false;

  const username = user.get('username');

  const { id } = request.params;

  // eslint-disable-next-line no-undef
  const gameQ = new Parse.Query('Game');
  gameQ.fromLocalDatastore();

  const game = await gameQ.get(id, { useMasterKey: true });

  // If no game dont perform operation
  if (!game) return;

  // Ready button pops up
  game.askToBeReady({ username });

  return true;
};

const readyState = async (request) => {
  const { user } = request;

  if (!user) return false;

  const username = user.get('username');

  const { id, ready } = request.params;

  // eslint-disable-next-line no-undef
  const gameQ = new Parse.Query('Game');
  gameQ.fromLocalDatastore();

  const game = await gameQ.get(id, { useMasterKey: true });

  // If no game dont perform operation
  if (!game) return;

  // Ready button pops up
  game.toggleReady({ username, ready });

  return true;
};

module.exports = {
  createGame,
  reportPlayer,
  editGame,
  joinLeaveGame,
  toggleClaim,
  kickPlayer,
  startGame,
  readyState,
};
