const pickTeam = async (request) => {
  const { user } = request;

  if (!user) return false;

  const username = user.get('username');

  const { id, picks } = request.params;

  // eslint-disable-next-line no-undef
  const gameQ = new Parse.Query('Game');
  gameQ.fromLocalDatastore();

  const game = await gameQ.get(id, { useMasterKey: true });

  // If no game dont perform operation
  if (!game) return;

  // Picks team
  game.pickTeam({ username, picks });

  return true;
};

const voteForMission = async (request) => {
  const { user } = request;

  if (!user) return false;

  const username = user.get('username');

  const { id, vote } = request.params;

  // eslint-disable-next-line no-undef
  const gameQ = new Parse.Query('Game');
  gameQ.fromLocalDatastore();

  const game = await gameQ.get(id, { useMasterKey: true });

  // If no game dont perform operation
  if (!game) return;

  // Ready button pops up
  game.voteForMission({ username, vote });

  return true;
};

const voteForSuccess = async (request) => {
  const { user } = request;

  if (!user) return false;

  const username = user.get('username');

  const { id, vote } = request.params;

  // eslint-disable-next-line no-undef
  const gameQ = new Parse.Query('Game');
  gameQ.fromLocalDatastore();

  const game = await gameQ.get(id, { useMasterKey: true });

  // If no game dont perform operation
  if (!game) return;

  // Ready button pops up
  game.voteForSuccess({ username, vote });

  return true;
};

const ladyOfTheLake = async (request) => {
  const { user } = request;

  if (!user) return false;

  const username = user.get('username');

  const { id, carded } = request.params;

  // eslint-disable-next-line no-undef
  const gameQ = new Parse.Query('Game');
  gameQ.fromLocalDatastore();

  const game = await gameQ.get(id, { useMasterKey: true });

  // If no game dont perform operation
  if (!game) return;

  // Ready button pops up
  game.ladyOfTheLake({ username, target: carded });

  return true;
};

const shootPlayer = async (request) => {
  const { user } = request;

  if (!user) return false;

  const username = user.get('username');

  const { id, shot } = request.params;

  // eslint-disable-next-line no-undef
  const gameQ = new Parse.Query('Game');
  gameQ.fromLocalDatastore();

  const game = await gameQ.get(id, { useMasterKey: true });

  // If no game dont perform operation
  if (!game) return;

  // Ready button pops up
  game.shootPlayer({ username, shot });

  return true;
};

module.exports = {
  pickTeam,
  voteForMission,
  voteForSuccess,
  ladyOfTheLake,
  shootPlayer,
};
