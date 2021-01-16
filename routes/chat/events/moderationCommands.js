const Environment = require('../../constructors/environment');
const Moderation = require('../../constructors/moderation');

function moderationCommands(io, socket) {
  const { user } = socket;
  const username = user.get('username');
  const allowed = user.get('isMod') || user.get('isAdmin');

  const getResponse = (isGeneral) => {
    return isGeneral ? 'generalCommandResponse' : 'gameCommandResponse';
  };

  const warning = 'You must fill all the required variables for this command to work.';
  const unauthorized = 'You are not authorized to use this command.';

  socket.on('suspendPlayer', (data) => {
    const { isGeneral } = data;

    if (allowed) {
      const { target, hours, comment } = data;

      if (typeof target !== 'string') {
        socket.emit(getResponse(isGeneral), warning);
        return;
      }

      Moderation.suspendPlayer({
        username,
        target,
        hours,
        comment,
      })
        .then((result) => {
          socket.emit(getResponse(isGeneral), result);

          console.log(result);
        })
        .catch((err) => console.log(err));
    } else {
      socket.emit(getResponse(isGeneral), unauthorized);
    }
  });

  socket.on('revokeSuspension', (data) => {
    const { isGeneral } = data;

    if (allowed) {
      const { target, comment } = data;

      if (typeof target !== 'string') {
        socket.emit(getResponse(isGeneral), warning);
        return;
      }

      Moderation.revokeSuspension({
        username,
        target,
        comment,
      })
        .then((result) => {
          socket.emit(getResponse(isGeneral), result);

          console.log(result);
        })
        .catch((err) => console.log(err));
    } else {
      socket.emit(getResponse(isGeneral), unauthorized);
    }
  });

  socket.on('verifyPlayer', (data) => {
    const { isGeneral } = data;

    if (allowed) {
      const { target, comment } = data;

      if (typeof target !== 'string') {
        socket.emit(getResponse(isGeneral), warning);
        return;
      }

      Moderation.verifyPlayer({
        username,
        target,
        comment,
      })
        .then((result) => {
          socket.emit(getResponse(isGeneral), result);

          console.log(result);
        })
        .catch((err) => console.log(err));
    } else {
      socket.emit(getResponse(isGeneral), unauthorized);
    }
  });

  socket.on('banPlayer', (data) => {
    const { isGeneral } = data;

    if (allowed) {
      const { target, comment } = data;

      if (typeof target !== 'string') {
        socket.emit(getResponse(isGeneral), warning);
        return;
      }

      Moderation.banPlayer({
        username,
        target,
        comment,
      })
        .then((result) => {
          socket.emit(getResponse(isGeneral), result);

          console.log(result);
        })
        .catch((err) => console.log(err));
    } else {
      socket.emit(getResponse(isGeneral), unauthorized);
    }
  });

  socket.on('revokeBan', (data) => {
    const { isGeneral } = data;

    if (allowed) {
      const { target, comment } = data;

      if (typeof target !== 'string') {
        socket.emit(getResponse(isGeneral), warning);
        return;
      }

      Moderation.revokeBan({
        username,
        target,
        comment,
      })
        .then((result) => {
          socket.emit(getResponse(isGeneral), result);

          console.log(result);
        })
        .catch((err) => console.log(err));
    } else {
      socket.emit(getResponse(isGeneral), unauthorized);
    }
  });

  socket.on('banPlayerIP', (data) => {
    const { isGeneral } = data;

    if (allowed) {
      const { target, comment } = data;

      if (typeof target !== 'string') {
        socket.emit(getResponse(isGeneral), warning);
        return;
      }

      Moderation.banPlayerIP({
        username,
        target,
        comment,
      })
        .then((result) => {
          socket.emit(getResponse(isGeneral), result);

          console.log(result);
        })
        .catch((err) => console.log(err));
    } else {
      socket.emit(getResponse(isGeneral), unauthorized);
    }
  });

  socket.on('revokeIPBan', (data) => {
    const { isGeneral } = data;

    if (allowed) {
      const { target, comment } = data;

      if (typeof target !== 'string') {
        socket.emit(getResponse(isGeneral), warning);
        return;
      }

      const content = Moderation.revokeIPBan({
        username,
        ips: [target],
        comment,
      });

      socket.emit(getResponse(isGeneral), content);
    } else {
      socket.emit(getResponse(isGeneral), unauthorized);
    }
  });

  socket.on('getLogs', (data) => {
    const { isGeneral } = data;

    if (allowed) {
      const environment = Environment.getGlobal();
      const logs = environment.get('moderationLogs');

      const content = `Moderation Logs Received. Open Browser Console.`;

      socket.emit(getResponse(isGeneral), content).emit('printLogs', logs);
    } else {
      socket.emit(getResponse(isGeneral), unauthorized);
    }
  });

  socket.on('toggleMaintenance', (data) => {
    const { isGeneral } = data;

    if (allowed) {
      const environment = Environment.getGlobal();
      environment.toggleMaintenance();

      const content = `Maintenance mode was toggled.`;

      socket.emit(getResponse(isGeneral), content);
      io.emit('reloadPage');
    } else {
      socket.emit(getResponse(isGeneral), unauthorized);
    }
  });

  socket.on('toggleLockdown', (data) => {
    const { isGeneral } = data;

    if (allowed) {
      const environment = Environment.getGlobal();
      const onLockdown = environment.toggleLockdown();

      const content = `Lockdown mode is ${onLockdown ? 'on' : 'off'}.`;

      socket.emit(getResponse(isGeneral), content);
    } else {
      socket.emit(getResponse(isGeneral), unauthorized);
    }
  });

  socket.on('createAnnouncement', (data) => {
    if (allowed) {
      const environment = Environment.getGlobal();

      environment.addAnnouncement({
        ...data,
        author: username,
      });

      const chat = environment.get('chat');
      chat
        .fetch({ useMasterKey: true })
        .then((c) => {
          c.newAnnouncement(`New announcement: "${data.title}".`);

          io.emit('announcementResponse', environment.get('announcementLogs').slice(-5));
        })
        .catch((err) => console.log(err));
    }
  });

  socket.on('avatarSet', (data) => {
    if (allowed) {
      // eslint-disable-next-line no-undef
      const userQ = new Parse.Query('_User');
      userQ.equalTo('username', data.user);

      userQ
        .first({
          useMasterKey: true,
        })
        .then((u) => {
          if (u) {
            u.set('avatars', {
              res: data.res,
              spy: data.spy,
            });

            u.save({}, { useMasterKey: true });

            const environment = Environment.getGlobal();
            environment.addAvatarLog(data);
          }
        })
        .catch((err) => console.log(err));
    }
  });

  socket.on('requestPasswordReset', (data) => {
    const { isGeneral, email } = data;

    if (allowed) {
      // eslint-disable-next-line no-undef
      Parse.User.requestPasswordReset(email);

      socket.emit(getResponse(isGeneral), 'Password Reset Sent.');
    } else {
      socket.emit(getResponse(isGeneral), unauthorized);
    }
  });

  socket.on('discordSet', (data) => {
    const { isGeneral, url } = data;

    if (allowed) {
      const environment = Environment.getGlobal();

      environment.set('discordWebhookURL', url);
      environment
        .save({}, { useMasterKey: true })
        .then((e) => {
          e.setDiscordHook();

          socket.emit(getResponse(isGeneral), 'Discord Webhook Set.');
        })
        .catch((err) => console.log(err));
    } else {
      socket.emit(getResponse(isGeneral), unauthorized);
    }
  });
}

module.exports = moderationCommands;
