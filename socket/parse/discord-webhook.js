const { Webhook, MessageBuilder } = require('discord-webhook-node');
const imageUrl = 'https://i.ibb.co/4V3K5rM/report-logo.png';

class DiscordReports {
	constructor() {
		this.hook = null;
	}

	newHook(url) {
		this.hook = new Webhook(url);

		this.hook.setUsername('Player Reports');
		this.hook.setAvatar(imageUrl);
	}

	newReport(user, room, motive, description) {
		const embed = new MessageBuilder()
			.setTitle('New Player Report')
			.setAuthor('Avalon.ist', imageUrl, 'https://www.avalon.ist')
			.setURL('https://www.avalon.ist')
			.addField('Player', user + ' » ' + room)
			.addField('Motive', motive)
			.addField('Description', description)
			.setColor('#c40d0d')
			.setFooter('Date of emission', imageUrl)
			.setTimestamp();

		this.hook.send(embed);
	}
}

module.exports = new DiscordReports();
