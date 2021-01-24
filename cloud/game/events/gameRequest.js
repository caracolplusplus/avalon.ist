const joinRoom = async (game, user) => {
  await user.fetch({ useMasterKey: true });

  const username = user.get('username');
  const avatars = user.get('avatars');

  // If the game is not active and not finished pretend is not found
  if (!game.get('active') && !game.get('ended')) {
    return false;
  }

  // Add client to game
  await game.addClient({
    username,
    avatars,
  });

  return true;
};

const gameLeave = async (request) => {
  const { user } = request;

  if (!user) return false;

  const username = user.get('username');
  const { id } = request.params;

  // eslint-disable-next-line no-undef
  const gameQ = new Parse.Query('Game');
  gameQ.fromLocalDatastore();

  const game = await gameQ.get(id, { useMasterKey: true });

  if (!game) return false;

  game.removeClient({
    username,
  });

  return true;
};

const gameRequest = async (request) => {
  const { user } = request;

  if (!user) return false;

  const { id } = request.params;

  // eslint-disable-next-line no-undef
  const gameQ = new Parse.Query('Game');
  gameQ.fromLocalDatastore();

  let game = await gameQ.get(id, { useMasterKey: true });

  if (!game) {
    // eslint-disable-next-line no-undef
    const replayQ = new Parse.Query('Game');

    game = await replayQ.get(id, { useMasterKey: true });

    if (!game) return false;

    game.pin();
  }

  return await joinRoom(game, user);
};

module.exports = { gameRequest, gameLeave };
