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
          const h = u.setSuspension({ hours });

          Environment.addModerationLog({
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
          u.revokeSuspension();

          Environment.addModerationLog({
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
          u.toggleLock();

          Environment.addModerationLog({
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
          u.toggleBan(true);

          Environment.addModerationLog({
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
          u.toggleBan(false);

          Environment.addModerationLog({
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
          const ips = u.get('addressList');
          u.toggleBan(false);

          Environment.toggleIps({ ips, add: true });

          Environment.addModerationLog({
            action: 'BAN IP',
            from: username,
            to: target,
            comment,
            info: {
              ips,
            },
          });

          return `${target} has been banned and all IP addresses: [${ips.join(
            ', '
          )}] are blacklisted.`;
        }

        return `No player exists with username "${target}".`;
      })
      .catch((e) => console.log(e));
  }

  revokeIPBan(data) {
    const { username, ips, comment } = data;

    Environment.toggleIps({ ips, add: false });

    Environment.addModerationLog({
      action: 'REVOKE IP BAN',
      from: username,
      comment,
      info: {
        ips,
      },
    });

    return `Addresses [${ips.join(', ')}] have been whitelisted.`;
  }
}

module.exports = new Moderation();
