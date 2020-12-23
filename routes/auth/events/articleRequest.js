function articleRequest(io, socket) {
  socket.on('articleRequest', (id) => {
    const environment = require('../../constructors/environment').getGlobal();

    const articles = environment.get('announcementLogs');

    for (let i = articles.length - 1; i >= 0; i--) {
      if (articles[i].id === id) {
        socket.emit('articleResponse', articles[i]);
        return;
      }
    }

    socket.emit('articleNotFound');
  });
}

module.exports = articleRequest;
