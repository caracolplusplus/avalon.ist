/* global Parse */
module.exports = (request) => {
  async function setSchemas() {
    // Logs
    // Error
    const messageSchema = new Parse.Schema('Message');
    const announcementSchema = new Parse.Schema('Announcement');
    const avatarSchema = new Parse.Schema('Avatar');

    const chatSchema = new Parse.Schema('Chat');
    const userSchema = new Parse.Schema('_User');
    const gameSchema = new Parse.Schema('Game');

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
        .addIndex('code_1', { code: 1 })
        .addIndex('type_1', { type: 1 });

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
        .deleteField('messageCap')
        .addIndex('code_1', { code: 1 })
        .addIndex('game_1', { game: 1 });

      await chatSchema.update();
    } catch (err) {
      console.log('set Chat');
    }

    try {
      avatarSchema.addIndex('timestamp', { timestamp: 1 });

      await avatarSchema.update();
    } catch (err) {
      console.log('set Avatar');
    }

    try {
      userSchema
        .deleteField('messageCooldown')
        .deleteField('socketsOnline')
        .deleteField('lastInstance')
        .deleteField('instanceList');

      await userSchema.update();
    } catch (err) {
      console.log('set User');
    }

    try {
      gameSchema
        .deleteField('instanceList')
        .deleteField('privateKnowledge')
        .deleteField('avatarList')
        .deleteField('gameId')
        .deleteField('spectatorList')
        .deleteField('previousLink')
        .deleteField('unique');

      await gameSchema.update();
    } catch (err) {
      console.log('set Game');
    }
  }

  return setSchemas(request);
};
