/* global Parse */

module.exports = (request) => {
  async function logsToObject() {
    // eslint-disable-next-line no-undef
    const envQ = new Parse.Query('Environment');

    const env = await envQ.first({ useMasterKey: true });

    const Avatar = Parse.Object.extend('Avatar');
    const Announcement = Parse.Object.extend('Announcement');
    const Logs = Parse.Object.extend('Logs');
    const Err = Parse.Object.extend('Error');

    const avatars = env.get('avatarLogs');
    const announcements = env.get('announcementLogs');
    const logs = env.get('moderationLogs');
    const errors = env.get('errorLogs');

    const avatarsMap = avatars.map((a) => {
      const ava = new Avatar();

      ava.set('user', a.user);
      ava.set('timestamp', a.timestamp);
      ava.set('avatar', a.avatar);

      return ava;
    });

    const announcementMap = announcements.map((a) => {
      const ann = new Announcement();

      ann.set('url', a.id);
      ann.set('title', a.title);
      ann.set('author', a.author);
      ann.set('timestamp', a.timestamp);
      ann.set('content', a.content);

      return ann;
    });

    const logMap = logs.map((l) => {
      const log = new Logs();

      log.set('action', l.action);
      log.set('from', l.from);
      log.set('to', l.to);
      log.set('comment', l.comment);
      log.set('info', l.info);
      log.set('duration', l.duration);
      log.set('timestamp', l.timestamp);

      return log;
    });

    const errorMap = errors.map((e) => {
      const error = new Err();

      error.set('message', e.message);
      error.set('stack', e.stack);

      return error;
    });

    Parse.Object.saveAll(announcementMap, {
      useMasterKey: true,
    });

    Parse.Object.saveAll(errorMap, {
      useMasterKey: true,
    });

    Parse.Object.saveAll(avatarsMap, {
      useMasterKey: true,
    });

    Parse.Object.saveAll(logMap, {
      useMasterKey: true,
    });
  }

  return logsToObject(request);
};
