const Game = require('../../constructors/game');
const Environment = require('../../constructors/environment');

function beforeGame(io, socket) {
  const { user } = socket;
  const username = user.get('username');
  // eslint-disable-next-line no-unused-vars
  const { game } = socket;

  // Creates a game with a unique ID
  socket.on('createGame', (data) => {
    // Gets data from client
    const { roleSettings, playerMax, listed } = data;

    // Gets environment global variables
    const environment = Environment.getGlobal();

    // Gets the game count of session variable
    environment.increment('games');

    environment
      .save({}, { useMasterKey: true })
      .then((e) => {
        const code = e.get('games').toString();

        // Creates the game object
        const game = Game.spawn({ code });
        game.set('listed', listed);

        // Set initial game settings
        game.editSettings({ roleSettings, playerMax });

        game
          .save({}, { useMasterKey: true })
          .then((g) => {
            // Pins it to local datastore
            g.pin();
            // Build chat
            g.buildChat();
            // Redirect to room with game id
            socket.emit('createGameSuccess', g.id);
            // Toggle seat for this player
            g.togglePlayer({ username, add: true });
          })
          .catch((err) => {
            console.log(err);
          });

        // Gets the general chat from environment
        const chat = e.get('chat');
        chat
          .fetch({ useMasterKey: true })
          .then((c) => {
            // Sends message to general chat
            // Room was created
            c.roomCreated({ username, code });
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => console.log(err));
  });

  // Reports a player through discord webhook
  socket.on('reportPlayer', (data) => {
    // Retrieve game from socket
    const { game } = socket;

    // If this socket is not in a game is an error
    if (!game) return;

    // Gets the code of the room
    const room = game.get('code');

    // Unpacks data
    const { selected, cause, description } = data;
    // Ask for discord webhook
    const DiscordReports = require('../../security/discordReports');

    // Adds report
    DiscordReports.newReport({
      user: username,
      target: selected,
      room,
      motive: cause,
      description,
    });
  });

  // Edits game settings
  socket.on('editGame', (data) => {
    // Unpacks data
    const { roleSettings, playerMax } = data;
    // Retrieve game from socket
    const { game } = socket;

    // If no game dont perform operation
    if (!game) return;

    // Fetch from database
    game.fetchFromLocalDatastore({ useMasterKey: true }).then((g) => {
      // Edit settings
      g.editSettings({ roleSettings, playerMax });
      // Save settings
      g.save({}, { useMasterKey: true });
    });
  });

  // Sit or stand up from game
  socket.on('joinLeaveGame', () => {
    // Retrieve game from socket
    const { game } = socket;

    // If no game return
    if (!game) return;

    // Fetch from database
    game
      .fetchFromLocalDatastore({ useMasterKey: true })
      .then((g) => {
        // Sit or stand up
        g.togglePlayer({ username, add: true });
      })
      .catch((err) => console.log(err));
  });

  // Toggle claims symbol on player who made the request
  socket.on('toggleClaim', () => {
    // Retrieve game from socket
    const { game } = socket;

    // If no game return
    if (!game) return;

    // Fetch from database
    game
      .fetchFromLocalDatastore({ useMasterKey: true })
      .then((g) => {
        // Toggle the claim symbol for this player
        g.toggleClaim(username);
      })
      .catch((err) => console.log(err));
  });

  // Host kicks player from game
  socket.on('kickPlayer', (data) => {
    const { game } = socket;

    if (!game) return;

    game
      .fetchFromLocalDatastore({ useMasterKey: true })
      .then((g) => {
        g.addToKick(data);
      })
      .catch((err) => console.log(err));
  });

  // Starts the game
  socket.on('startGame', () => {
    const { game } = socket;

    if (!game) return;

    // Fetch from database
    game
      .fetchFromLocalDatastore({ useMasterKey: true })
      .then((g) => {
        // If player is not host, ignore this request
        const host = g.get('host');

        if (host !== username) return;

        // Ready button pops up
        g.askToBeReady({ username });
      })
      .catch((err) => console.log(err));
  });

  // Tells the game that this player is ready
  socket.on('readyState', (ready) => {
    const { game } = socket;

    if (!game) return;

    game.toggleReady({ username, ready });
  });
}

module.exports = beforeGame;
