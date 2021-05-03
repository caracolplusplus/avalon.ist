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

  //Store current time and date and append it to base server messege
  const timestamp = Date.now();
  const objectId = timestamp.toString();

  //Create base messege
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

  
  /** Creates new instance of Chat object containing empty list of messeges
   * @param  {} {code code number
   * @param  {} game} game number
   */
  static spawn({ code, game }) {
    const chat = new Chat();

    chat.set('code', code);
    chat.set('game', game);
    chat.set('messages', []);

    return chat;
  }
  /** Method used to create a new taunt
   * @param  {} data containing data neccessery to create new Taunt object
   */
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
  /** Async method, used to add new messages to chat (message list).
   * Tis method is called everytime a message is to be saved.
   * @param  {} newMessages - a list of new message to be added
   */
  async saveMessages(newMessages) {
    const listsQ = new Parse.Query('Lists');

    const lists = await listsQ.first({ useMasterKey: true });
    const c = await this.fetch({ useMasterKey: true });

    const Message = Parse.Object.extend('Message');

    const code = c.get('code');
    const game = c.get('game');
    const id = game ? game.id : '';
    const moderatorList = lists.get('moderatorList');

    //Anonymous mapping method that uses flat message list from client.
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
  /** This method will add a message from a moderator
   * @param  {} data - data used to create a message
   */
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
  /** This method will add new taunt to chat
   * @param  {} data - data used to create a message
   */
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
  /** This method will create announcement about new room
   * @param  {} data - data used to create a message
   */
  roomCreated(data) {
    const { username, code } = data;

    this.saveMessages([
      addMessage({
        content: `${username} has created Room ${code}.`,
      }),
    ]);

    return true;
  }
  /** Called when current match is ended
   * @param  {} data
   */ 
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
  /** Handler called on match start 
   * @param  {} data - settings and session code
   */
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

    //For every active setting, a message to server will be send
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
  /** Handler called when leader is selecting a team
   * @param  {} data
   */
  onPick(data) {
    const { leader } = data;

    this.saveMessages([
      addMessage({
        content: `Waiting for ${leader} to select a team.`,
      }),
    ]);

    return true;
  }
  /** Handler called after leader selected a team
   * @param  {} data - mission name, round number, players' passes
   */
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
  /** Handler called after all players has made a vote. 
   * @param  {} data - mission name, round number, result of voting
   */
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
  /** Handler called after passing
   * @param  {} data - players' picks
   */
  afterPassing(data) {
    const { picks } = data;

    this.saveMessages([
      addMessage({
        content: `Waiting for ${picks.join(', ')} to choose the fate of this mission.`,
      }),
    ]);

    return true;
  }
  /** Handler called after a mission is ended
   * @param  {} data - mission name, number of failes, players' picks
   */
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
  /** Handler called when assassin player is making a turn
   * @param  {} data - assasin info
   */
  waitingForShot(data) {
    const { assassin } = data;

    this.saveMessages([
      addMessage({
        content: `Waiting for ${assassin} to select a target.`,
      }),
    ]);

    return true;
  }
  /** Handler called when lady player is making a turn 
   * @param  {} data
   */
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
   /** Handler called after lady player has made a turn 
   * @param  {} data
   */
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

   /** Handler called after assassin player has made a turn 
   * @param  {} data
   */
  afterShot(data) {
    const { target } = data;

    this.saveMessages([
      addMessage({
        content: `${target} was shot.`,
      }),
    ]);

    return true;
  }
  /** Hanlder called at the end of game.
   * @param  {} data
   */
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

    //After determining a result, it is annouenced to players
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
  /** Handler called when a room has been voided
   */
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
//Chat object is registered as a new subclass to Parse api module
Parse.Object.registerSubclass('Chat', Chat);

module.exports = Chat;
