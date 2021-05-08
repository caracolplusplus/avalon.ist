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
  /** Method used to set lock status to player with target username
   * @param  {} data - admin moderator, target username, comment from moderator
   */
  verifyPlayer(data) {
    const { username, target, comment } = data;

    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', target);

    //For every player in user list, if user with target name exists, he will have
    //a lock status enabled. If such player has not been found, an error will be 
    //thrown
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

  /** Method used to ban player with target username
   * @param  {} data - admin moderator, target username, comment from moderator
   */
  banPlayer(data) {
    const { username, target, comment } = data;

    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', target);

    //For every player in user list, if user with target name exists, he will
    //be banned. If such player has not been found, an error will be 
    //thrown
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
  /** Method used to remove ban from user with given username
   * @param  {} data - admin moderator, target username, comment from moderator
   */ 
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
  /** Method used to ban an IP address associated  with target username
   * @param  {} data - admin moderator, target username, comment from moderator
   */
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

  /** Method used to remove ban from IP address associated with player with given username
   * @param  {} data - admin moderator, target username, comment from moderator
   */ 
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
