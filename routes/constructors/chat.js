/* global Parse */
const messageTypes = {
  SERVER: 'server',
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
};

const gameName = 'Avalon.ist Game';

const addMessage = (data) => {
  // This function must be updated in client as well

  const { SERVER } = messageTypes;

  const timestamp = Date.now();
  const id = timestamp;

  const message = {
    _public: true,
    type: SERVER,
    from: gameName,
    to: [],
    content: 'Hello World!',
    timestamp,
    ...data,
    id,
  };

  return message;
};

class Chat extends Parse.Object {
  constructor() {
    super('Chat');
    this.addMessage = addMessage;
  }

  static spawn({ code }) {
    const chat = new Chat();

    chat.set('code', code);
    chat.set('messages', []);
    chat.set('messageCap', 1000);

    return chat;
  }

  async saveMessages(newMessages) {
    await this.fetch({ useMasterKey: true });

    const messages = this.get('messages');
    const messageCap = this.get('messageCap');

    const env = require('./environment').getGlobal();
    const modList = env.get('moderatorList');

    newMessages = newMessages.filter((m) => {
      const { type, to, from } = m;

      if (type !== 'direct' || modList.includes(from) || modList.includes(to[0]))
        return true;

      return false;
    });

    if (!newMessages.length) return false;

    messages.push(...newMessages);

    while (messages.length > messageCap) messages.shift();

    this.set('messages', messages);

    this.save({}, { useMasterKey: true, context: { messages: newMessages } });

    return true;
  }

  moderationAction(data) {
    const { content, username, target, comment, action } = data;
    const environment = require('./environment').getGlobal();

    this.saveMessages([
      addMessage({
        content,
      }),
    ]);

    environment.addModerationLog({
      action,
      from: username,
      to: target,
      comment,
    });

    return true;
  }

  newAnnouncement(content) {
    this.saveMessages([
      addMessage({
        content,
      }),
    ]);

    return true;
  }

  newTaunt(data) {
    const { title, target } = data;

    this.saveMessages([
      addMessage({
        content: title.replace('You', target).replace('have', 'has'),
      }),
    ]);

    return true;
  }

  roomCreated(data) {
    const { username, code } = data;

    this.saveMessages([
      addMessage({
        content: `${username} has created Room #${code}.`,
      }),
    ]);

    return true;
  }

  roomFinished(data) {
    const { POSITIVE, NEGATIVE } = messageTypes;
    const { code, winner } = data;

    const outcome = winner ? 'The Resistance Wins' : 'The Spies Win';

    this.saveMessages([
      addMessage({
        content: `Game #${code} has finished. ${outcome}.`,
        type: winner ? POSITIVE : NEGATIVE,
      }),
    ]);

    return true;
  }

  onStart(data) {
    const { settings, code } = data;

    const arr = [];

    const roles = {
      merlin: 'Merlin',
      percival: 'Percival',
      morgana: 'Morgana',
      assassin: 'Assassin',
      oberon: 'Oberon',
      mordred: 'Mordred',
      lady: 'Lady of the Lake',
      empty: 'No special roles',
    };

    for (const r in settings) {
      const active = settings[r];

      if (active) arr.push(roles[r]);
    }

    if (!arr.length) arr.push(roles['empty']);

    this.saveMessages([
      addMessage({
        content: `Room ${code} starts with: ${arr.join(', ')}.`,
      }),
    ]);

    return true;
  }

  onPick(data) {
    const { leader } = data;

    this.saveMessages([
      addMessage({
        content: `Waiting for ${leader} to select a team.`,
      }),
    ]);

    return true;
  }

  afterPick(data) {
    const { mission, round, picks } = data;

    this.saveMessages([
      addMessage({
        content: `Mission ${mission}.${round} picked: ${picks.join(', ')}.`,
      }),
      addMessage({
        content: 'Everybody vote.',
      }),
    ]);

    return true;
  }

  async afterVote(data) {
    const { mission, round, passes } = data;

    const result = passes ? 'approved' : 'rejected';

    this.saveMessages([
      addMessage({
        content: `Everybody has voted! Mission ${mission}.${round} has been ${result}.`,
      }),
    ]);

    return true;
  }

  afterPassing(data) {
    const { picks } = data;

    this.saveMessages([
      addMessage({
        content: `Waiting for ${picks.join(', ')} to choose the fate of this mission.`,
      }),
    ]);

    return true;
  }

  async afterMission(data) {
    const { NEGATIVE, POSITIVE } = messageTypes;
    const { mission, fails, passes } = data;

    const result = passes ? 'succeeded' : 'failed';

    const failCount = [`.`, ` with 1 fail.`, ` with ${fails} fails.`];

    const failResult = fails < 2 ? failCount[fails] : failCount[2];

    this.saveMessages([
      addMessage({
        type: passes ? POSITIVE : NEGATIVE,
        content: `Mission ${mission} has ${result}${failResult}`,
      }),
    ]);

    return true;
  }

  waitingForShot(data) {
    const { assassin } = data;

    this.saveMessages([
      addMessage({
        content: `Waiting for ${assassin} to select a target.`,
      }),
    ]);

    return true;
  }

  waitingForLady(data) {
    const { lady } = data;

    this.saveMessages([
      addMessage({
        content: `Waiting for ${lady} to use Lady of the Lake.`,
      }),
    ]);

    this.save({}, { useMasterKey: true });

    return true;
  }

  afterCard(data) {
    const { NEGATIVE, POSITIVE } = messageTypes;
    const { username, target, spy } = data;

    const result = spy ? 'a Spy' : 'a member of the Resistance.';

    this.saveMessages([
      addMessage({
        content: `${username} has used Lady of the Lake on ${target}.`,
      }),
      addMessage({
        type: spy ? NEGATIVE : POSITIVE,
        _public: false,
        content: `${target} is ${result}`,
        to: [username],
      }),
    ]);

    return true;
  }

  afterShot(data) {
    const { target } = data;

    this.saveMessages([
      addMessage({
        content: `${target} was shot.`,
      }),
    ]);

    return true;
  }

  onEnd(data) {
    const { NEGATIVE, POSITIVE } = messageTypes;
    const { ending, winner } = data;

    const code = this.get('code');

    const type = winner ? POSITIVE : NEGATIVE;

    const endingResult = [
      'Merlin has been killed! The Spies Win.',
      'Merlin was not killed! The Resistance wins.',
      'Three missions have failed! The Spies Win.',
      'Mission hammer was rejected! The Spies Win.',
      'Three missions have succeeded! The Resistance wins.',
    ][ending];

    this.saveMessages([
      addMessage({
        type,
        content: `Game ${code} has finished.`,
      }),
      addMessage({
        type,
        content: endingResult,
      }),
    ]);

    return true;
  }

  onVoid() {
    const code = this.get('code');

    this.saveMessages([
      addMessage({
        content: `Room ${code} has been voided.`,
      }),
    ]);

    return true;
  }

  async suspendPlayer(data) {
    const { username, target, hours, comment } = data;

    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', target);

    return await userQ
      .first({ useMasterKey: true })
      .then((u) => {
        if (u) {
          const environment = require('./environment').getGlobal();
          const h = u.setSuspension({ hours });

          environment.addModerationLog({
            duration: h,
            action: 'SUSPENSION',
            from: username,
            to: target,
            comment,
          });

          this.save({}, { useMasterKey: true });

          return `${target} has been suspended for ${h} hour${h === 1 ? '' : 's'}.`;
        }

        return `No player exists with username "${target}".`;
      })
      .catch((e) => console.log(e));
  }

  async revokeSuspension(data) {
    const { username, target, comment } = data;

    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', target);

    return await userQ
      .first({ useMasterKey: true })
      .then((u) => {
        if (u) {
          const environment = require('./environment').getGlobal();
          u.revokeSuspension();

          environment.addModerationLog({
            action: 'REVOKE SUSPENSION',
            from: username,
            to: target,
            comment,
          });

          this.save({}, { useMasterKey: true });
          return `${target} has been unsuspended.`;
        }

        return `No player exists with username "${target}".`;
      })
      .catch((e) => console.log(e));
  }

  async banPlayer(data) {
    const { username, target, comment } = data;

    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', target);

    return await userQ
      .first({ useMasterKey: true })
      .then((u) => {
        if (u) {
          const environment = require('./environment').getGlobal();
          u.toggleBan(true);

          environment.addModerationLog({
            action: 'BAN',
            from: username,
            to: target,
            comment,
          });

          this.save({}, { useMasterKey: true });
          return `${target} has been banned.`;
        }

        return `No player exists with username "${target}".`;
      })
      .catch((e) => console.log(e));
  }

  async revokeBan(data) {
    const { username, target, comment } = data;

    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', target);

    return await userQ
      .first({ useMasterKey: true })
      .then((u) => {
        if (u) {
          const environment = require('./environment').getGlobal();
          u.toggleBan(false);

          environment.addModerationLog({
            action: 'REVOKE BAN',
            from: username,
            to: target,
            comment,
          });

          this.save({}, { useMasterKey: true });
          return `${target} has been unbanned.`;
        }

        return `No player exists with username "${target}".`;
      })
      .catch((e) => console.log(e));
  }

  async banPlayerIP(data) {
    const { username, target, comment } = data;

    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', target);

    return await userQ
      .first({ useMasterKey: true })
      .then((u) => {
        if (u) {
          const environment = require('./environment').getGlobal();
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

          this.save({}, { useMasterKey: true });
          return `${target} has been banned and all their IP adresses are blacklisted.`;
        }

        return `No player exists with username "${target}".`;
      })
      .catch((e) => console.log(e));
  }

  revokeIPBan(data) {
    const { username, ips, comment } = data;

    const environment = require('./environment').getGlobal();

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

Parse.Object.registerSubclass('Chat', Chat);

module.exports = Chat;
