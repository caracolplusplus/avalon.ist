/* global Parse */

module.exports = (request) => {
  async function messagesToObject() {
    const Message = Parse.Object.extend('Message');
    const chatQ = new Parse.Query('Chat');

    chatQ.limit(10000);

    const chatList = await chatQ.find({ useMasterKey: true });

    chatList.forEach((c) => {
      const realtime = Date.now();

      const code = c.get('code');
      const game = c.get('game');
      const id = game ? game.id : '';

      const mList = c.get('messages').map((m, i) => {
        const newM = new Message();

        const ACL = new Parse.ACL();
        ACL.setPublicReadAccess(true);
        ACL.setPublicWriteAccess(false);

        newM.setACL(ACL);

        newM.set('global', code === 'Global');
        newM.set('code', id);
        newM.set('public', m._public);
        newM.set('type', m.type);
        newM.set('from', m.from);
        newM.set('to', m.to);
        newM.set('content', m.content);
        newM.set('timestamp', m.timestamp);
        newM.set('realtime', realtime + i);

        return newM;
      });

      Parse.Object.saveAll(mList, { useMasterKey: true }).then(
        (list) => {
          const rel = c.relation('messagesNew');

          rel.add(list);

          c.save({}, { useMasterKey: true });
        },
        (error) => {
          // An error occurred while saving one of the objects.
        }
      );
    });
  }

  return messagesToObject(request);
};
