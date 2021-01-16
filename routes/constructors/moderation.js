/* global Parse */
const Environment = require('./environment');

class Moderation {
  suspendPlayer(data) {
    const { username, target, hours, comment } = data;

    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', target);

    return userQ
      .first({ useMasterKey: true })
      .then((u) => {
        if (u) {
          const environment = Environment.getGlobal();
          const h = u.setSuspension({ hours });

          environment.addModerationLog({
            duration: h,
            action: 'SUSPENSION',
            from: username,
            to: target,
            comment,
          });

          return `${target} has been suspended for ${h} hour${h === 1 ? '' : 's'}.`;
        }

        return `No player exists with username "${target}".`;
      })
      .catch((e) => console.log(e));
  }

  revokeSuspension(data) {
    const { username, target, comment } = data;

    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', target);

    return userQ
      .first({ useMasterKey: true })
      .then((u) => {
        if (u) {
          const environment = Environment.getGlobal();
          u.revokeSuspension();

          environment.addModerationLog({
            action: 'REVOKE SUSPENSION',
            from: username,
            to: target,
            comment,
          });

          return `${target} has been unsuspended.`;
        }

        return `No player exists with username "${target}".`;
      })
      .catch((e) => console.log(e));
  }

  verifyPlayer(data) {
    const { username, target, comment } = data;

    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', target);

    return userQ
      .first({ useMasterKey: true })
      .then((u) => {
        if (u) {
          const environment = Environment.getGlobal();
          u.toggleLock();

          environment.addModerationLog({
            action: 'TOGGLE PLAYER LOCK',
            from: username,
            to: target,
            comment,
          });

          return `${target} has been allowed on site.`;
        }

        return `No player exists with username "${target}".`;
      })
      .catch((e) => console.log(e));
  }

  banPlayer(data) {
    const { username, target, comment } = data;

    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', target);

    return userQ
      .first({ useMasterKey: true })
      .then((u) => {
        if (u) {
          const environment = Environment.getGlobal();
          u.toggleBan(true);

          environment.addModerationLog({
            action: 'BAN',
            from: username,
            to: target,
            comment,
          });

          return `${target} has been banned.`;
        }

        return `No player exists with username "${target}".`;
      })
      .catch((e) => console.log(e));
  }

  revokeBan(data) {
    const { username, target, comment } = data;

    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', target);

    return userQ
      .first({ useMasterKey: true })
      .then((u) => {
        if (u) {
          const environment = Environment.getGlobal();
          u.toggleBan(false);

          environment.addModerationLog({
            action: 'REVOKE BAN',
            from: username,
            to: target,
            comment,
          });

          return `${target} has been unbanned.`;
        }

        return `No player exists with username "${target}".`;
      })
      .catch((e) => console.log(e));
  }

  banPlayerIP(data) {
    const { username, target, comment } = data;

    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', target);

    return userQ
      .first({ useMasterKey: true })
      .then((u) => {
        if (u) {
          const environment = Environment.getGlobal();
          const ips = u.get('addressList');
          u.toggleBan(false);

          environment.toggleIps({ ips, add: true });

          environment.addModerationLog({
            action: 'BAN IP',
            from: username,
            to: target,
            comment,
            info: {
              ips,
            },
          });

          return `${target} has been banned and all their IP adresses are blacklisted.`;
        }

        return `No player exists with username "${target}".`;
      })
      .catch((e) => console.log(e));
  }

  revokeIPBan(data) {
    const { username, ips, comment } = data;

    const environment = Environment.getGlobal();

    environment.toggleIps({ ips, add: false });

    environment.addModerationLog({
      action: 'REVOKE IP BAN',
      from: username,
      comment,
      info: {
        ips,
      },
    });

    return `Addresses ${ips.join(', ')} has been whitelisted.`;
  }
}

module.exports = new Moderation();
