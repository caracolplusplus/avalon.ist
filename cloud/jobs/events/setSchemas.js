/* global Parse */
module.exports = (request) => {
  async function setSchemas() {
    const messageSchema = new Parse.Schema('Message');
    const announcementSchema = new Parse.Schema('Announcement');
    const chatSchema = new Parse.Schema('Chat');

    // gets the current schema data
    messageSchema.get();
    announcementSchema.get();
    chatSchema.get();

    // returns schema for all classes
    await Parse.Schema.all();

    try {
      messageSchema
        .addIndex('global_1', { global: 1 })
        .addIndex('public_1', { public: 1 })
        .addIndex('from_1', { from: 1 })
        .addIndex('code_1', { code: 1 });

      await messageSchema.update();
    } catch (err) {
      console.log('set Message');
    }

    try {
      announcementSchema
        .addIndex('url_1', { url: 1 })
        .addIndex('timestamp_1', { timestamp: 1 });

      await announcementSchema.update();
    } catch (err) {
      console.log('set Announcement');
    }

    try {
      chatSchema
        .deleteField('messages')
        .addIndex('code_1', { code: 1 })
        .addIndex('game_1', { game: 1 });

      await chatSchema.update();
    } catch (err) {
      console.log('set Chat');
    }
  }

  return setSchemas(request);
};
