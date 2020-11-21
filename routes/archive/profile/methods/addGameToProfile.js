async function addGameToProfile({ data, user }) {
  const { code, role, res, cause, winner } = data;

  await user.fetch();

  const gameHistory = user.get('gameHistory');
  const games = user.get('games');
  const gameStats = user.get('gameStats');
  const gameShots = user.get('gameShots');

  gameHistory.push(code);

  games[1]++;
  gameStats[role][1]++;

  if (winner === res) {
    games[0]++;
    gameStats[role][0]++;
  }

  if (cause < 2 && role === 'assassin') {
    gameShots[1]++;

    if (cause < 1) gameShots[0]++;
  }

  user.set('gameHistory', gameHistory);
  user.set('games', games);
  user.set('gameStats', gameStats);
  user.set('gameShots', gameShots);

  user.save(
    {},
    {
      useMasterKey: true,
      context: {
        masterSave: true,
      },
    }
  );

  return user;
}

module.exports = addGameToProfile;
