function terminate(server, options = { coredump: false, timeout: 500 }) {
  // Exit function
  const exit = (code) => {
    options.coredump ? process.abort() : process.exit(code);
  };

  return (code, reason) => (err, promise) => {
    const environment = require('./constructors/environment').getGlobal();

    if (err && err instanceof Error) {
      const { message, stack } = err;

      environment.addErrorLog({ message, stack });

      console.log(message, stack);
    }

    // Attempt a graceful shutdown
    server.close(exit);
    setTimeout(exit, options.timeout).unref();
  };
}

module.exports = terminate;
