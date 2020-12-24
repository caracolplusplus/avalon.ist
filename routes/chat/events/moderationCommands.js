function moderationCommands(io, socket) {
  const { user } = socket;
  const username = user.get('username');
  const allowed = user.get('isMod') || user.get('isAdmin');

  const getChat = () => {
    const environment = require('../../constructors/environment').getGlobal();

    return environment.get('chat');
  };

  const getResponse = (isGeneral) => {
    return isGeneral ? 'generalCommandResponse' : 'gameCommandResponse';
  };

  const warning = 'You must fill all the required variables for this command to work.';
  const unauthorized = 'You are not authorized to use this command.';

  socket.on('suspendPlayer', async (data) => {
    const { isGeneral } = data;

    if (allowed) {
      const { target, hours, comment } = data;

      if (typeof target !== 'string') {
        socket.emit(getResponse(isGeneral), warning);
        return;
      }

      const chat = getChat();

      const content = await chat.suspendPlayer({
        username,
        target,
        hours,
        comment,
      });

      socket.emit(getResponse(isGeneral), content);
    } else {
      socket.emit(getResponse(isGeneral), unauthorized);
    }
  });

  socket.on('revokeSuspension', async (data) => {
    const { isGeneral } = data;

    if (allowed) {
      const { target, comment } = data;

      if (typeof target !== 'string') {
        socket.emit(getResponse(isGeneral), warning);
        return;
      }

      const chat = getChat();

      const content = await chat.revokeSuspension({
        username,
        target,
        comment,
      });

      socket.emit(getResponse(isGeneral), content);
    } else {
      socket.emit(getResponse(isGeneral), unauthorized);
    }
  });

  socket.on('banPlayer', async (data) => {
    const { isGeneral } = data;

    if (allowed) {
      const { target, comment } = data;

      if (typeof target !== 'string') {
        socket.emit(getResponse(isGeneral), warning);
        return;
      }

      const chat = getChat();

      const content = await chat.banPlayer({
        username,
        target,
        comment,
      });

      socket.emit(getResponse(isGeneral), content);
    } else {
      socket.emit(getResponse(isGeneral), unauthorized);
    }
  });

  socket.on('revokeBan', async (data) => {
    const { isGeneral } = data;

    if (allowed) {
      const { target, comment } = data;

      if (typeof target !== 'string') {
        socket.emit(getResponse(isGeneral), warning);
        return;
      }

      const chat = getChat();

      const content = await chat.revokeBan({
        username,
        target,
        comment,
      });

      socket.emit(getResponse(isGeneral), content);
    } else {
      socket.emit(getResponse(isGeneral), unauthorized);
    }
  });

  socket.on('banPlayerIP', async (data) => {
    const { isGeneral } = data;

    if (allowed) {
      const { target, comment } = data;

      if (typeof target !== 'string') {
        socket.emit(getResponse(isGeneral), warning);
        return;
      }

      const chat = getChat();

      const content = await chat.banPlayerIP({
        username,
        target,
        comment,
      });

      socket.emit(getResponse(isGeneral), content);
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

      const chat = getChat();

      const content = chat.revokeIPBan({
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
      const environment = require('../../constructors/environment').getGlobal();
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
      const environment = require('../../constructors/environment').getGlobal();
      environment.toggleMaintenance();

      const content = `Maintenance mode was toggled.`;

      socket.emit(getResponse(isGeneral), content);
      io.emit('reloadPage');
    } else {
      socket.emit(getResponse(isGeneral), unauthorized);
    }
  });

  socket.on('createAnnouncement', async (data) => {
    if (allowed) {
      const environment = require('../../constructors/environment').getGlobal();
      const res = environment.addAnnouncement({
        ...data,
        author: username,
      });

      const chat = environment.get('chat');
      await chat.fetch({ useMasterKey: true });
      await res;

      chat.newAnnouncement(`New announcement: "${data.title}".`);

      io.emit('announcementResponse', environment.get('announcementLogs').slice(-5));
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

            const environment = require('../../constructors/environment').getGlobal();
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

  socket.on('discordSet', async (data) => {
    const { isGeneral, url } = data;

    if (allowed) {
      const environment = require('../../constructors/environment').getGlobal();

      environment.set('discordWebhookURL', url);
      await environment.save({}, { useMasterKey: true });

      environment.setDiscordHook();

      socket.emit(getResponse(isGeneral), 'Discord Webhook Set.');
    } else {
      socket.emit(getResponse(isGeneral), unauthorized);
    }
  });
}

module.exports = moderationCommands;
