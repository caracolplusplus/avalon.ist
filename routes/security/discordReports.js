const { Webhook, MessageBuilder } = require('discord-webhook-node');
const imageUrl = 'https://i.ibb.co/4V3K5rM/report-logo.png';

class DiscordReports {
  constructor() {
    this.hook = null;
  }

  newHook(url) {
    this.hook = new Webhook(url);

    this.hook.setUsername('Avalon.ist Webhook');
    this.hook.setAvatar(imageUrl);
  }

  newReport({ user, target, room, motive, description }) {
    const embed = new MessageBuilder()
      .setTitle('New Player Report')
      .setAuthor('Avalon.ist', imageUrl, 'https://avalon.ist/')
      .setURL('https://avalon.ist/')
      .addField('Reporting', `${target} » ${room}`)
      .addField('Sent by', user)
      .addField('Motive', motive)
      .addField('Description', description)
      .setColor('#c40d0d')
      .setFooter('Date of emission', imageUrl)
      .setTimestamp();

    this.hook.send(embed);
  }

  newError({ message, stack }) {
    const embed = new MessageBuilder()
      .setTitle('An error has occured')
      .addField('Message', message)
      .addField('stack', stack)
      .setColor('#c40d0d')
      .setTimestamp();

    this.hook.send(embed);
  }
}

module.exports = new DiscordReports();
