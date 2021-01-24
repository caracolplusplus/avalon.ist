/* global Parse */
const Environment = require('./environment');
const messageTypes = {
  SERVER: 'server',
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
};

const gameName = '-SERVER MESSAGE-';

const addMessage = (data) => {
  // This function must be updated in client as well

  const { SERVER } = messageTypes;

  const timestamp = Date.now();
  const objectId = timestamp.toString();

  const message = {
    public: typeof data.public === 'boolean' ? data.public : true,
    type: data.type || SERVER,
    from: data.from || gameName,
    to: data.to || [],
    content: data.content || 'Hello World!',
    timestamp,
    objectId,
  };

  return message;
};

class Chat extends Parse.Object {
  constructor() {
    super('Chat');
    this.addMessage = addMessage;
  }

  static spawn({ code, game }) {
    const chat = new Chat();

    chat.set('code', code);
    chat.set('game', game);
    chat.set('messages', []);

    return chat;
  }

  async saveTaunt(data) {
    const Taunt = Parse.Object.extend('Taunt');

    const newT = new Taunt();

    const c = await this.fetch({ useMasterKey: true });

    const code = c.get('code');
    const game = c.get('game');
    const id = game ? game.id : '';

    const ACL = new Parse.ACL();
    ACL.setPublicReadAccess(true);
    ACL.setPublicWriteAccess(false);

    newT.setACL(ACL);
    newT.set('global', code === 'Global');
    newT.set('code', id);
    newT.set('to', data.to);
    newT.set('from', data.from);
    newT.set('audio', data.audio);

    newT.save({}, { useMasterKey: true });

    return true;
  }

  async saveMessages(newMessages) {
    const listsQ = new Parse.Query('Lists');

    const lists = await listsQ.first({ useMasterKey: true });
    const c = await this.fetch({ useMasterKey: true });

    const Message = Parse.Object.extend('Message');

    const code = c.get('code');
    const game = c.get('game');
    const id = game ? game.id : '';
    const moderatorList = lists.get('moderatorList');

    newMessages = newMessages
      .map((m, i) => {
        const { public: _public, type, to, from, content, timestamp } = m;

        if (
          type !== 'direct' ||
          moderatorList.includes(from) ||
          moderatorList.includes(to[0])
        ) {
          const newM = new Message();

          const ACL = new Parse.ACL();
          ACL.setPublicReadAccess(true);
          ACL.setPublicWriteAccess(false);

          newM.setACL(ACL);
          newM.set('global', code === 'Global');
          newM.set('code', id);
          newM.set('public', _public);
          newM.set('type', type);
          newM.set('from', from);
          newM.set('to', to);
          newM.set('content', content);
          newM.set('timestamp', timestamp);
          newM.set('realtime', Date.now() + i);

          return newM;
        }

        return null;
      })
      .filter((m) => m !== null);

    const savedMessages = await Parse.Object.saveAll(newMessages, { useMasterKey: true });

    c.relation('messagesNew').add(savedMessages);

    c.save({}, { useMasterKey: true });
  }

  moderationAction(data) {
    const { content, username, target, comment, action } = data;

    this.saveMessages([
      addMessage({
        content,
      }),
    ]);

    Environment.addModerationLog({
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
    const { from, to, audio } = data;

    const content = {
      notification: `${to} has been buzzed by ${from}.`,
      slapped: `${to} has been slapped by ${from}.`,
      licked: `${to} has been licked by ${from}`,
    }[audio];

    this.saveMessages([
      addMessage({
        content,
      }),
    ]);

    this.saveTaunt(data);

    return true;
  }

  roomCreated(data) {
    const { username, code } = data;

    this.saveMessages([
      addMessage({
        content: `${username} has created Room ${code}.`,
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
        content: `Game ${code} has finished. ${outcome}.`,
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

  afterVote(data) {
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

  afterMission(data) {
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
        public: false,
        type: spy ? NEGATIVE : POSITIVE,
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
    const { ending, winner, code } = data;

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
}

Parse.Object.registerSubclass('Chat', Chat);

module.exports = Chat;
