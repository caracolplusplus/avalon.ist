const Environment = require('../../constructors/environment');
const Moderation = require('../../constructors/moderation');

const warning = 'You must fill all the required variables for this command to work.';
const unauthorized = 'You are not authorized to use this command.';
/*
  Every function in this file has to verify if user is either mod or admin
*/
const suspendPlayer = async (request) => {
  const { user } = request;

  if (!user) return false;

  const isAllowed = user.get('isMod') || user.get('isAdmin');
  const username = user.get('username');

  if (isAllowed) {
    const { target, hours, comment } = request.params;

    if (!target) {
      return warning;
    }

    return await Moderation.suspendPlayer({
      username,
      target,
      hours,
      comment,
    });
  } else {
    return unauthorized;
  }
};

const revokeSuspension = async (request) => {
  const { user } = request;

  if (!user) return false;

  const isAllowed = user.get('isMod') || user.get('isAdmin');
  const username = user.get('username');

  if (isAllowed) {
    const { target, comment } = request.params;

    if (!target) {
      return warning;
    }

    return await Moderation.revokeSuspension({
      username,
      target,
      comment,
    });
  } else {
    return unauthorized;
  }
};

const verifyPlayer = async (request) => {
  const { user } = request;

  if (!user) return false;

  const isAllowed = user.get('isMod') || user.get('isAdmin');
  const username = user.get('username');

  if (isAllowed) {
    const { target, comment } = request.params;

    if (!target) {
      return warning;
    }

    return await Moderation.verifyPlayer({
      username,
      target,
      comment,
    });
  } else {
    return unauthorized;
  }
};

const banPlayer = async (request) => {
  const { user } = request;

  if (!user) return false;

  const isAllowed = user.get('isMod') || user.get('isAdmin');
  const username = user.get('username');

  if (isAllowed) {
    const { target, comment } = request.params;

    if (!target) {
      return warning;
    }

    return await Moderation.banPlayer({
      username,
      target,
      comment,
    });
  } else {
    return unauthorized;
  }
};

const revokeBan = async (request) => {
  const { user } = request;

  if (!user) return false;

  const isAllowed = user.get('isMod') || user.get('isAdmin');
  const username = user.get('username');

  if (isAllowed) {
    const { target, comment } = request.params;

    if (!target) {
      return warning;
    }

    return await Moderation.revokeBan({
      username,
      target,
      comment,
    });
  } else {
    return unauthorized;
  }
};

const banPlayerIP = async (request) => {
  const { user } = request;

  if (!user) return false;

  const isAllowed = user.get('isMod') || user.get('isAdmin');
  const username = user.get('username');

  if (isAllowed) {
    const { target, comment } = request.params;

    if (!target) {
      return warning;
    }

    return await Moderation.banPlayerIP({
      username,
      target,
      comment,
    });
  } else {
    return unauthorized;
  }
};

const revokeIPBan = async (request) => {
  const { user } = request;

  if (!user) return false;

  const isAllowed = user.get('isMod') || user.get('isAdmin');
  const username = user.get('username');

  if (isAllowed) {
    const { target, comment } = request.params;

    if (!target) {
      return warning;
    }

    return Moderation.revokeIPBan({
      username,
      ips: [target],
      comment,
    });
  } else {
    return unauthorized;
  }
};

const getLogs = async (request) => {
  const { user } = request;

  if (!user) return false;

  const isAllowed = user.get('isMod') || user.get('isAdmin');

  if (isAllowed) {
    // eslint-disable-next-line no-undef
    // get last 100 newest log entries
    const logQ = new Parse.Query('Logs');
    logQ.limit(100);
    logQ.ascending('timestamp');

    const logList = await logQ.find({ useMasterKey: true });

    const logs = logList.map((l) => l.toJSON());

    return { content: 'Logs printed to the browser console.', logs };
  } else {
    return { content: unauthorized, logs: [] };
  }
};

const toggleMaintenance = async (request) => {
  const { user } = request;

  if (!user) return false;

  const isAllowed = user.get('isMod') || user.get('isAdmin');

  if (isAllowed) {
    const environment = await Environment.getGlobal();
    environment.toggleMaintenance();

    return `Maintenance mode was toggled.`;
  } else {
    return unauthorized;
  }
};

const toggleLockdown = async (request) => {
  const { user } = request;

  if (!user) return false;

  const isAllowed = user.get('isMod') || user.get('isAdmin');

  if (isAllowed) {
    const environment = await Environment.getGlobal();
    const onLockdown = environment.toggleLockdown();

    return `Lockdown mode is ${onLockdown ? 'on' : 'off'}.`;
  } else {
    return unauthorized;
  }
};

const newAnnouncement = async (request) => {
  const { user } = request;

  if (!user) return false;

  const isAllowed = user.get('isMod') || user.get('isAdmin');
  const username = user.get('username');

  if (isAllowed) {
    const { id, title, content } = request.params;

    Environment.addAnnouncement({
      id,
      title,
      content,
      author: username,
    });

    const environment = await Environment.getGlobal();

    const chat = environment.get('chat');

    await chat.fetch({ useMasterKey: true });
    chat.newAnnouncement(`New announcement: "${title}".`);
  }

  return true;
};

const avatarSet = async (request) => {
  const { user } = request;

  if (!user) return false;

  const isAllowed = user.get('isMod') || user.get('isAdmin');

  if (isAllowed) {
    const { target, res, spy } = request.params;

    // eslint-disable-next-line no-undef
    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', target);

    const u = await userQ.first({ useMasterKey: true });

    u.set('avatars', {
      res,
      spy,
    });

    u.save({}, { useMasterKey: true });

    Environment.addAvatarLog({ target, res, spy });
  }

  return true;
};

const requestPasswordReset = async (request) => {
  const { user } = request;

  if (!user) return false;

  const isAllowed = user.get('isMod') || user.get('isAdmin');

  if (isAllowed) {
    // eslint-disable-next-line no-undef
    Parse.User.requestPasswordReset(email);

    return 'Password Reset Sent';
  } else {
    return unauthorized;
  }
};

const discordSet = async (request) => {
  const { user } = request;

  if (!user) return false;

  const isAllowed = user.get('isMod') || user.get('isAdmin');

  if (isAllowed) {
    const { url, hook } = request.params;

    if (!url || !hook) {
      return warning;
    }

    const environment = await Environment.getGlobal();

    const hooks = environment.get('discordHooks') || {};

    hooks[hook] = url;

    environment.set('discordHooks', hooks);
    environment.setDiscordHook();

    environment.save({}, { useMasterKey: true });

    return 'Discord Webhook Set';
  } else {
    return unauthorized;
  }
};

module.exports = {
  suspendPlayer,
  revokeSuspension,
  verifyPlayer,
  banPlayer,
  revokeBan,
  banPlayerIP,
  revokeIPBan,
  getLogs,
  toggleLockdown,
  toggleMaintenance,
  newAnnouncement,
  avatarSet,
  requestPasswordReset,
  discordSet,
};
