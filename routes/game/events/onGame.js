function onGame(io, socket) {
  const { user } = socket;
  const username = user.get('username');

  socket.on('pickTeam', (data) => {
    const { game } = socket;
    const { team: picks } = data;

    if (!game) return;

    game
      .fetch({ useMasterKey: true })
      .then((g) => g.pickTeam({ username, picks }))
      .catch((err) => console.log(err));
  });

  socket.on('voteForMission', (data) => {
    const { game } = socket;
    const { vote } = data;

    if (!game) return;

    game
      .fetch({ useMasterKey: true })
      .then((g) => g.voteForMission({ username, vote }))
      .catch((err) => console.log(err));
  });

  socket.on('voteForSuccess', (data) => {
    const { game } = socket;
    const { vote } = data;

    if (!game) return;

    game
      .fetch({ useMasterKey: true })
      .then((g) => g.voteForSuccess({ username, vote }))
      .catch((err) => console.log(err));
  });

  socket.on('ladyOfTheLake', (data) => {
    const { game } = socket;
    const { carded } = data;

    if (!game) return;

    game
      .fetch({ useMasterKey: true })
      .then((g) => g.ladyOfTheLake({ username, target: carded }))
      .catch((err) => console.log(err));
  });

  socket.on('shootPlayer', (data) => {
    const { game } = socket;
    const { shot } = data;

    if (!game) return;

    game
      .fetch({ useMasterKey: true })
      .then((g) => g.shootPlayer({ username, shot }))
      .catch((err) => console.log(err));
  });
}

module.exports = onGame;
