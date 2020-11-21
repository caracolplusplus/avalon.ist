/* global Parse, Set */
const messageTypes = {
	HELP: 'help',
	COMMAND: 'command',
	CLIENT: 'client',
	SERVER: 'server',
	POSITIVE: 'positive',
	NEGATIVE: 'negative',
	BROADCAST: 'broadcast',
	QUOTE: 'quote',
};

const helpMod = {
	1: [
		'Moderation Actions',
		"/ss {player} {hours?} - Enacts a temporary suspension on the given player's account.",
		"/unss {player} - Lifts a temporary suspension from the given player's account.",
		"/ban {player} - Enacts a permanent ban on the given player's account.",
		"/unban {player} - Lifts a permanent ban from the given player's account.",
		"/banip {player} - Enacts a permanent ban on the given player's account and its correspondent IPs.",
		'/unbanip {ip} - Lifts a permanent ban on the given IP address.',
		'/logs - Retrieves moderation logs and prints them in browser console.',
		'/maintenance - Toggles the maintenance feature of the site. It will disconnect everyone if its currently on maintenance.',
	],
	2: [
		'Game Moderation Actions',
		'/pause {room code} - Pauses the specified game and no actions can be performed while the game is paused.',
		'/unpause {room code} - Unpauses the specified game and actions can be performed again.',
		'/end {room code} {outcome?} - Ends the specified game with the specified outcome. Entering 1 will make Resistance win, entering 0 will make Spy win. Not entering any outcome will void the game.',
		'/close {room code} - Closes the specified game and kicks every player in the room.',
		'/learnroles {room code} - Shows the roles of all the players in the specified game.',
	],
	3: [
		'URL Handlers',
		'/aveset {user} {res url} {spy url} - Sets the URLs for the Avatars of this player.',
		'/discordset {url} - Sets the URL for the Reports Webhook on Discord.',
	],
	4: [
		'Buzzes',
		'/dm {player} {message} - Sends a direct message to the player specified. The direct message will send a notification to the player.',
		'/lick {player} - Show your love to someone by licking them!',
		'/slap {player} - If you prefer something more aggressive, try slapping them!',
		'/buzz {player} - However, if you just want to call their attention, try buzzing them!',
	],
	5: [
		'Miscelaneous',
		'/roll {sides?} - Rolls a die. Enter a number to change the number of sides.',
		'/flip - Flips a coin.',
		'/clear - Clears the chat.',
	],
};

const helpClient = {
	1: [
		'Buzzes',
		'/dm {moderator} {message} - Sends a direct message to the moderator specified.',
		'/lick {player} - Show your love to someone by licking them!',
		'/slap {player} - If you prefer something more aggressive, try slapping them!',
		'/buzz {player} - However, if you just want to call their attention, try buzzing them!',
	],
	2: [
		'Miscelaneous',
		'/roll {sides?} - Rolls a die. Enter a number to change the number of sides.',
		'/flip - Flips a coin.',
		'/clear - Clears the chat.',
	],
};

const serverName = 'Avalon.ist';

class Chat extends Parse.Object {
	constructor() {
		super('Chat');

		this.set('messages', []);
		this.set('messageCap', 1000);
	}

	static spawn({ code }) {
		const chat = new Chat();

		chat.set('code', code);
		chat.set('messages', []);
		chat.set('messageCap', 1000);

		return chat;
	}

	setCode(code) {
		this.set('code', code);
	}

	addMessage(data) {
		const { SERVER } = messageTypes;

		const messages = this.get('messages');
		const messageCap = this.get('messageCap');

		const timestamp = Date.now();
		const id = `${timestamp}.${messages.length}`;

		messages.push({
			_public: true,
			type: SERVER,
			from: serverName,
			to: [],
			content: 'Hello World!',
			timestamp,
			...data,
			id,
		});

		while (messages.length > messageCap) messages.shift();

		this.set('messages', messages);

		return true;
	}

	zalgoTest(data) {
		const zalgo = /%CC%/g;

		return zalgo.test(encodeURIComponent(data));
	}

	sendMessage(data) {
		const { COMMAND, CLIENT } = messageTypes;
		const { username, content } = data;

		const hasZalgo = this.zalgoTest(content);

		this.addMessage(
			hasZalgo
				? {
						type: COMMAND,
						_public: false,
						content: 'You are trying to post a message with invalid characters. Please, refrain from doing it.',
						to: [username],
				  }
				: {
						type: CLIENT,
						from: username,
						content,
				  }
		);

		this.save({}, { useMasterKey: true });

		return true;
	}

	findQuote(data) {
		const { CLIENT, QUOTE, COMMAND } = messageTypes;
		const { username, content } = data;
		const messages = this.get('messages');

		let quotesExist = false;

		const quoteTrimmer = (x) => x.trim();
		const quoteRegex = /[0-9]{2}:[0-9]{2} /;

		let quotes = content.split(quoteRegex).map(quoteTrimmer);

		quotes = new Set(quotes);

		messages.forEach((message) => {
			const { type, _public, from, content: _content } = message;

			if (_public) {
				const referent = type === CLIENT ? `${from}:${_content}` : _content;

				if (!quotes.has(referent)) return false;

				quotes.delete(referent);

				if (!quotesExist) {
					this.addMessage({
						content: `${username} quotes:`,
					});

					quotesExist = true;
				}

				const quote = { ...message, type: QUOTE };

				this.addMessage(quote);
			}
		});

		if (!quotesExist)
			this.addMessage({
				type: COMMAND,
				_public: false,
				content: `Quote received doesn't exist`,
				to: [username],
			});

		this.save({}, { useMasterKey: true });

		return true;
	}

	roomCreated(data) {
		const { username, code } = data;

		this.addMessage({
			content: `${username} has created Room ${code}.`,
		});

		this.save({}, { useMasterKey: true });

		return true;
	}

	roomFinished(data) {
		const { code, winner } = data;
		const outcome = winner ? 'The Resistance Wins' : 'The Spies Win';

		this.addMessage({
			content: `Game ${code} has finished. ${outcome}.`,
		});

		this.save({}, { useMasterKey: true });

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

		this.addMessage({
			content: `Room ${code} starts with: ${arr.join(', ')}.`,
		});

		this.save({}, { useMasterKey: true });

		return true;
	}

	onPick(data) {
		const { leader } = data;

		this.addMessage({
			content: `Waiting for ${leader} to select a team.`,
		});

		this.save({}, { useMasterKey: true });

		return true;
	}

	afterPick(data) {
		const { mission, round, picks } = data;

		this.addMessage({
			content: `Mission ${mission}.${round} picked: ${picks.join(', ')}.`,
		});
		this.addMessage({
			content: 'Everybody vote.',
		});

		this.save({}, { useMasterKey: true });

		return true;
	}

	async afterVote(data) {
		const { mission, round, passes } = data;

		const result = passes ? 'approved' : 'rejected';

		this.addMessage({
			content: `Everybody has voted! Mission ${mission}.${round} has been ${result}.`,
		});

		this.save({}, { useMasterKey: true });

		return true;
	}

	afterPassing(data) {
		const { picks } = data;

		this.addMessage({
			content: `Waiting for ${picks.join(', ')} to choose the fate of this mission.`,
		});

		this.save({}, { useMasterKey: true });

		return true;
	}

	async afterMission(data) {
		const { NEGATIVE, POSITIVE } = messageTypes;
		const { mission, fails, passes } = data;

		const result = passes ? 'succeded' : 'failed';

		const failCount = [`.`, ` with 1 fail.`, ` with ${fails} fails.`];

		const failResult = fails < 2 ? failCount[fails] : failCount[2];

		this.addMessage({
			type: passes ? POSITIVE : NEGATIVE,
			content: `Mission ${mission} has ${result}${failResult}`,
		});

		this.save({}, { useMasterKey: true });

		return true;
	}

	waitingForShot(data) {
		const { assassin } = data;

		this.addMessage({
			content: `Waiting for ${assassin} to select a target.`,
		});

		this.save({}, { useMasterKey: true });

		return true;
	}

	waitingForLady(data) {
		const { lady } = data;

		this.addMessage({
			content: `Waiting for ${lady} to use Lady of the Lake.`,
		});

		this.save({}, { useMasterKey: true });

		return true;
	}

	afterCard(data) {
		const { NEGATIVE, POSITIVE } = messageTypes;
		const { username, target, spy } = data;

		const result = spy ? 'a Spy' : 'a member of the Resistance.';

		this.addMessage({
			content: `${username} has used Lady of the Lake on ${target}.`,
		});
		this.addMessage({
			type: spy ? NEGATIVE : POSITIVE,
			_public: false,
			content: `${target} is ${result}`,
			to: [username],
		});

		this.save({}, { useMasterKey: true });

		return true;
	}

	afterShot(data) {
		const { target } = data;

		this.addMessage({
			content: `${target} was shot.`,
		});

		this.save({}, { useMasterKey: true });

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

		this.addMessage({
			type,
			content: `Game ${code} has finished.`,
		});
		this.addMessage({
			type,
			content: endingResult,
		});

		this.save({}, { useMasterKey: true });

		return true;
	}

	onVoid() {
		const code = this.get('code');

		this.addMessage({
			content: `Room ${code} has been voided.`,
		});

		return true;
	}

	kickPlayer(data) {
		const { NEGATIVE } = messageTypes;
		const { host, player } = data;

		this.addMessage({
			type: NEGATIVE,
			content: `${player} has been kicked by ${host}`,
		});

		this.save({}, { useMasterKey: true });

		return true;
	}

	getCommandHelp(data) {
		const { COMMAND, HELP } = messageTypes;
		const { username, mod, page } = data;

		const pageMax = mod ? 5 : 2;

		let pageInt = parseInt(page);
		pageInt = isNaN(pageInt) || pageInt < 1 || pageInt > pageMax ? 1 : pageInt;

		const help = mod ? helpMod[pageInt] : helpClient[pageInt];

		help.forEach((content, i) =>
			this.addMessage({
				type: i ? COMMAND : HELP,
				_public: false,
				content,
				to: [username],
			})
		);

		this.save({}, { useMasterKey: true });

		return true;
	}

	suspendPlayer(data) {
		const { COMMAND } = messageTypes;
		const { username, target, hours, comment } = data;

		const userQ = new Parse.Query('_User');
		userQ.equalTo('username', target);

		userQ
			.first({ useMasterKey: true })
			.then((u) => {
				if (u) {
					const environment = require('./environment').getGlobal();
					const h = u.setSuspension({ hours });

					this.addMessage({
						type: COMMAND,
						_public: false,
						content: `${target} has been suspended for ${h} hour${h === 1 ? '' : 's'}.`,
						to: [username],
					});

					environment.addModerationLog({
						duration: h,
						action: 'SUSPENSION',
						from: username,
						to: target,
						comment,
					});

					this.save({}, { useMasterKey: true });
				}
			})
			.catch((e) => console.log(e));
	}

	revokeSuspension(data) {
		const { COMMAND } = messageTypes;
		const { username, target, comment } = data;

		const userQ = new Parse.Query('_User');
		userQ.equalTo('username', target);

		userQ
			.first({ useMasterKey: true })
			.then((u) => {
				if (u) {
					const environment = require('./environment').getGlobal();
					u.revokeSuspension();

					this.addMessage({
						type: COMMAND,
						_public: false,
						content: `${target} has been unsuspended.`,
						to: [username],
					});

					environment.addModerationLog({
						action: 'REVOKE SUSPENSION',
						from: username,
						to: target,
						comment,
					});

					this.save({}, { useMasterKey: true });
				}
			})
			.catch((e) => console.log(e));
	}

	banPlayer(data) {
		const { COMMAND } = messageTypes;
		const { username, target, comment } = data;

		const userQ = new Parse.Query('_User');
		userQ.equalTo('username', target);

		userQ
			.first({ useMasterKey: true })
			.then((u) => {
				if (u) {
					const environment = require('./environment').getGlobal();
					u.toggleBan(true);

					this.addMessage({
						type: COMMAND,
						_public: false,
						content: `${target} has been banned.`,
						to: [username],
					});

					environment.addModerationLog({
						action: 'BAN',
						from: username,
						to: target,
						comment,
					});

					this.save({}, { useMasterKey: true });
				}
			})
			.catch((e) => console.log(e));
	}

	revokeBan(data) {
		const { COMMAND } = messageTypes;
		const { username, target, comment } = data;

		const userQ = new Parse.Query('_User');
		userQ.equalTo('username', target);

		userQ
			.first({ useMasterKey: true })
			.then((u) => {
				if (u) {
					const environment = require('./environment').getGlobal();
					u.toggleBan(false);

					this.addMessage({
						type: COMMAND,
						_public: false,
						content: `${target} has been unbanned.`,
						to: [username],
					});

					environment.addModerationLog({
						action: 'REVOKE BAN',
						from: username,
						to: target,
						comment,
					});

					this.save({}, { useMasterKey: true });
				}
			})
			.catch((e) => console.log(e));
	}

	banPlayerIP(data) {
		const { COMMAND } = messageTypes;
		const { username, target, comment } = data;

		const userQ = new Parse.Query('_User');
		userQ.equalTo('username', target);

		userQ
			.first({ useMasterKey: true })
			.then((u) => {
				if (u) {
					const environment = require('./environment').getGlobal();
					const ips = u.get('addressList');
					u.toggleBan(false);

					this.addMessage({
						type: COMMAND,
						_public: false,
						content: `${target} has been banned and all their IP adresses are blacklisted.`,
						to: [username],
					});

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
				}
			})
			.catch((e) => console.log(e));
	}

	revokeIPBan(data) {
		const { COMMAND } = messageTypes;
		const { username, ips, comment } = data;

		const environment = require('./environment').getGlobal();

		this.addMessage({
			type: COMMAND,
			_public: false,
			content: `Addresses ${ips.join(', ')} has been whitelisted.`,
			to: [username],
		});

		environment.toggleIps({ ips, add: false });

		environment.addModerationLog({
			action: 'REVOKE IP BAN',
			from: username,
			comment,
			info: {
				ips,
			},
		});

		this.save({}, { useMasterKey: true });

		return true;
	}

	getLogs(data) {
		const { COMMAND } = messageTypes;
		const { username } = data;
		const environment = require('./environment').getGlobal();

		this.addMessage({
			type: COMMAND,
			_public: false,
			content: `Moderation Logs Received. Open Browser Console.`,
			to: [username],
		});

		this.save({}, { useMasterKey: true });

		return environment.get('moderationLogs');
	}

	toggleMaintenance(data) {
		const { COMMAND } = messageTypes;
		const { username } = data;
		const environment = require('./environment').getGlobal();

		this.addMessage({
			type: COMMAND,
			_public: false,
			content: `Maintenance mode was toggled.`,
			to: [username],
		});

		environment.toggleMaintenance();

		this.save({}, { useMasterKey: true });

		return true;
	}
}

Parse.Object.registerSubclass('Chat', Chat);

module.exports = Chat;
