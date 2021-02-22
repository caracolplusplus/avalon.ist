const { Webhook, MessageBuilder } = require('discord-webhook-node');
const imageUrl = 'https://i.ibb.co/4V3K5rM/report-logo.png';
const crypto = require('crypto');

class DiscordReports {
  constructor() {
    this.reports = null;
    this.signups = null;
    this.errors = null;
  }

  setHooks(hooks) {
    this.reports = new Webhook(hooks.reports || 'default');
    this.signups = new Webhook(hooks.signups || 'default');
    this.errors = new Webhook(hooks.errors || 'default');

    this.reports.setUsername('Reports');
    this.signups.setUsername('New Accounts');
    this.errors.setUsername('Errors');

    this.reports.setAvatar(imageUrl);
    this.signups.setAvatar(imageUrl);
    this.errors.setAvatar(imageUrl);
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

    this.reports.send(embed);
  }

  newError({ message, stack }) {
    const embed = new MessageBuilder()
      .setTitle('An error has occured')
      .addField('Message', message)
      .addField('Stack', stack)
      .setColor('#f7be21')
      .setTimestamp();

    this.errors.send(embed);
  }

  newSignUp({ username, address }) {
    const embed = new MessageBuilder()
      .setTitle('New Account')
      .addField('Username', username)
      .addField(
        'Encrypted IP Address',
        crypto.createHash('sha256').update(address).digest('base64')
      )
      .setColor('#0997aa')
      .setTimestamp();

    this.signups.send(embed);
  }
}

module.exports = new DiscordReports();
