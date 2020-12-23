const generator = require('generate-password');
const Game = require('../../constructors/game');

function beforeGame(io, socket) {
  const { user } = socket;
  const username = user.get('username');
  // eslint-disable-next-line no-unused-vars
  const { game } = socket;

  socket.on('createGame', async (data) => {
    const { roleSettings, playerMax, listed } = data;

    const environment = require('../../constructors/environment').getGlobal();

    let code = generator.generate({
      length: 20,
      numbers: true,
    });

    if (listed) {
      code = environment.get('games').toString();
      environment.increment('games');

      const chat = environment.get('chat');
      await chat.fetch();

      chat.roomCreated({ username, code });

      await environment.save({}, { useMasterKey: true });
    }

    const game = Game.spawn({ code });

    game.set('listed', listed);

    await game.editSettings({ roleSettings, playerMax });
    await game.togglePlayer({ username, add: true });

    socket.emit('createGameSuccess', code);
  });

  socket.on('reportPlayer', (data) => {
    const { game } = socket;

    if (!game) return;

    const room = game.get('code');

    const { selected, cause, description } = data;
    const DiscordReports = require('../../security/discordReports');

    DiscordReports.newReport({
      user: username,
      target: selected,
      room,
      motive: cause,
      description,
    });
  });

  socket.on('editGame', async (data) => {
    const { roleSettings, playerMax } = data;
    const { game } = socket;

    await game.fetch();

    game.editSettings({ roleSettings, playerMax });
  });

  socket.on('joinLeaveGame', async () => {
    const { game } = socket;

    await game.fetch();

    game.togglePlayer({ username, add: true });
  });

  socket.on('toggleClaim', async () => {
    const { game } = socket;

    await game.fetch();

    game.toggleClaim(username);
  });

  socket.on('kickPlayer', async (data) => {
    const { game } = socket;
    const { kick } = data;

    await game.fetch();

    await game.addToKick(data);
    game.togglePlayer({ username: kick, add: false });
  });

  socket.on('startGame', async () => {
    const { game } = socket;

    await game.fetch();

    game.startGame({ username });
  });
}

module.exports = beforeGame;
