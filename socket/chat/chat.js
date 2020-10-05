/* Message {
    Public
        BOOLEAN
    Content
        STRING
    Transmitter
        STRING
    Receiver
        STRING[]
    Type
        FROM_BROADCAST 2
        FROM_SERVER 1
        FROM_CLIENT 0
    Character
    	QUOTE 4
    	PRIVATE 3
        HIGHLIGHT 2
        POSITIVE 1
        NEUTRAL 0
        NEGATIVE -1
    Timestamp
        MILLISECONDS
} */

const ClientsOnline = require('../auth/clients-online').clients;
const Profile = require('../profile/profile');

const IpTree = require('../parse/ip-tree');
const GlobalEnvironment = require('../parse/globals');

const AVALONIST_NAME = 'AvalonistServerMessage';

const ChatList = [];
const ModLogs = [
	{
		message: 'Moderation Log Session Start',
		date: new Date().toUTCString(),
	},
];

class Chat {
	constructor(limit) {
		this.messages = [];
		this.limit = limit;

		ChatList.push(this);
	}

	// Delete messages past the message limit

	deletePastMessageLimit() {
		while (this.messages.length > this.limit) this.messages.shift();
	}

	// User Commands

	async parseCommand(username, content) {
		const splitContent = content.split(' ');

		switch (splitContent[0]) {
			case '/help':
				return this.commandHelp(username);
			case '/ss':
			case '/unss':
			case '/ban':
			case '/unban':
			case '/banip':
				return await this.commandModAction(username, splitContent);
			case '/unbanip':
				return await this.commandUnbanIp(username, splitContent);
			case '/logs':
				return this.commandModerationLogs(username);
			case '/dm':
				return this.commandDirectMessage(username, content, splitContent);
			case '/roll':
				return this.commandRollDie(username, splitContent);
			case '/flip':
				return this.commandFlipCoin(username);
			case '/slap':
			case '/buzz':
			case '/lick':
				return this.commandBuzzes(username, splitContent);
			case '/poggers':
			case '/bremus':
			case '/pingerus':
			case '/fortysixpercent':
				return this.commandCopyPastaGalore(username, splitContent);
			default:
				return this.invalidCommand(username);
		}
	}

	// Command List

	invalidCommand(username) {
		this.messages.push({
			public: false,
			content: 'Invalid Command. Try /help for a list of commands.',
			author: AVALONIST_NAME,
			to: [username],
			type: 1,
			character: 3,
			timestamp: Date.now(),
			id: Date.now(),
		});

		this.deletePastMessageLimit();

		return {
			type: 'NONE',
		};
	}

	commandHelp(username) {
		const caller = ClientsOnline[username].profile;

		const helpMessages =
			caller.isMod || caller.isAdmin
				? [
						'List of Commands:',
						"/ss {player} {hours?} - Enacts a temporary suspension on the given player's account.",
						"/unss {player} - Lifts a temporary suspension from the given player's account.",
						"/ban {player} - Enacts a permanent ban on the given player's account.",
						"/unban {player} - Lifts a permanent ban from the given player's account.",
						"/banip {player} - Enacts a permanent ban on the given player's account and its correspondent IPs.",
						'/unbanip {ip} - Lifts a permanent ban on the given IP address.',
						'/logs - Retrieves moderation logs and prints them in browser console.',
						'/dm {player} {message} - Sends a direct message to the player specified. The direct message will send a notification to the player.',
						'/lick {player} - Show your love to someone by licking them!',
						'/slap {player} - If you prefer something more aggressive, try slapping them!',
						'/buzz {player} - However, if you just want to call their attention, try buzzing them!',
						'/roll {sides?} - Rolls a die. Enter a number to change the number of sides.',
						'/flip - Flips a coin.',
						'/clear - Clears the chat.',
				  ]
				: [
						'List of Commands:',
						'/dm {moderator} {message} - Sends a direct message to the moderator specified.',
						'/lick {player} - Show your love to someone by licking them!',
						'/slap {player} - If you prefer something more aggressive, try slapping them!',
						'/buzz {player} - However, if you just want to call their attention, try buzzing them!',
						'/roll {sides?} - Rolls a die. Enter a number to change the number of sides.',
						'/flip - Flips a coin.',
						'/clear - Clears the chat.',
				  ];

		for (const x in helpMessages) {
			this.messages.push({
				public: false,
				content: helpMessages[x],
				author: AVALONIST_NAME,
				to: [username],
				type: 1,
				character: 3,
				timestamp: Date.now(),
				id: Date.now(),
			});
		}

		this.deletePastMessageLimit();

		return {
			type: 'NONE',
		};
	}

	async commandModAction(username, splitContent) {
		const hammer = ClientsOnline[username].profile;

		if (hammer.isMod || hammer.isAdmin) {
			const profile = await new Profile(splitContent[1]).getFromUser();

			if (profile && !profile.isAdmin && !profile.isMod) {
				let target = ClientsOnline[profile.user];

				let message = '';
				let socketList = [];

				switch (splitContent[0]) {
					case '/ss':
						let hours = parseFloat(splitContent[2]);
						hours = isNaN(hours) ? 1 : hours;

						profile.suspensionDate = Date.now() + hours * 3600000;
						profile.saveToUser();

						message =
							hours === 1 ? '{user} has been suspended for 1 hour.' : '{user} has been for suspended for {n} hours.';
						message = message.replace(/{user}/gi, profile.user).replace(/{n}/gi, hours);

						ModLogs.push({
							action: 'SUSPENSION',
							moderator: username,
							target: profile.user,
							lasts: hours + ' x HOUR',
							date: new Date().toUTCString(),
						});

						break;
					case '/unss':
						profile.suspensionDate = 0;
						profile.saveToUser();

						message = '{user} has been unsuspended.';
						message = message.replace(/{user}/gi, profile.user);

						ModLogs.push({
							action: 'REVOKE SUSPENSION',
							moderator: username,
							target: profile.user,
							lasts: 'PERMANENT',
							date: new Date().toUTCString(),
						});

						break;
					case '/ban':
						profile.isBanned = true;
						profile.saveToUser();

						message = '{user} has been banned.';
						message = message.replace(/{user}/gi, profile.user);

						ModLogs.push({
							action: 'BAN',
							moderator: username,
							target: profile.user,
							lasts: 'PERMANENT',
							date: new Date().toUTCString(),
						});

						break;
					case '/unban':
						profile.isBanned = false;
						profile.saveToUser();

						message = '{user} has been unbanned.';
						message = message.replace(/{user}/gi, profile.user);

						ModLogs.push({
							action: 'REVOKE BAN',
							moderator: username,
							target: profile.user,
							lasts: 'PERMANENT',
							date: new Date().toUTCString(),
						});

						break;
					case '/banip':
						profile.isBanned = true;
						profile.saveToUser();

						const ips = profile.ips;

						const main = await GlobalEnvironment();

						const addIpToTree = async () => {
							for (const x in ips) {
								const ip = ips[x];

								IpTree.readIp(ip, true);
							}

							return true;
						};

						const addIpToGlobals = async () => {
							const ipList = main.get('ipBlacklist');

							for (const x in ips) {
								const ip = ips[x];

								if (!ipList.includes(ip)) {
									ipList.push(ip);
								}
							}

							main.set('ipBlacklist', ipList);
							main.save({}, { useMasterKey: true });

							return true;
						};

						const disconnectAllPlayersWithIps = async () => {
							target = false;

							for (const x in ClientsOnline) {
								const client = ClientsOnline[x];

								if (client.profile.ips.some((y) => ips.indexOf(y) >= 0)) socketList = socketList.concat(client.sockets);
							}

							return true;
						};

						const prom0 = addIpToGlobals();
						const prom1 = addIpToTree();
						const prom2 = disconnectAllPlayersWithIps();

						await prom1;
						await prom2;

						message = '{user} has been banned and all of their IP adresses have been locked.';
						message = message.replace(/{user}/gi, profile.user);

						ModLogs.push({
							action: 'IP BAN',
							moderator: username,
							target: profile.user,
							lasts: 'PERMANENT',
							date: new Date().toUTCString(),
						});

						break;
				}

				this.messages.push({
					public: false,
					content: message,
					author: AVALONIST_NAME,
					to: [username],
					type: 1,
					character: 3,
					timestamp: Date.now(),
					id: Date.now(),
				});

				return {
					type: 'BAN',
					sockets: target ? target.sockets : socketList,
				};
			} else {
				this.messages.push({
					public: false,
					content: 'No user exists with the provided username, or the user is part of the moderation team.',
					author: AVALONIST_NAME,
					to: [username],
					type: 1,
					character: 3,
					timestamp: Date.now(),
					id: Date.now(),
				});

				this.deletePastMessageLimit();

				return {
					type: 'NONE',
				};
			}
		} else {
			return this.invalidCommand(username);
		}
	}

	async commandUnbanIp(username, splitContent) {
		const hammer = ClientsOnline[username].profile;

		if (hammer.isMod || hammer.isAdmin) {
			const ip = splitContent[1];

			if (IpTree.testIp(ip)) {
				const main = await GlobalEnvironment();

				const removeIpFromTree = async () => {
					IpTree.readIp(ip, false);

					return true;
				};

				const removeIpFromGlobals = async () => {
					const ipList = main.get('ipBlacklist');

					const index = ipList.indexOf(ip);

					if (index > -1) {
						ipList.splice(index, 1);
					}

					main.set('ipBlacklist', ipList);
					main.save({}, { useMasterKey: true });

					return true;
				};

				const prom0 = removeIpFromGlobals();
				const prom1 = removeIpFromTree();

				await prom1;

				let message = '{ip} has been removed from the IP blacklist.';
				message = message.replace(/{ip}/gi, ip);

				ModLogs.push({
					action: 'REVOKE IP BAN',
					moderator: username,
					target: ip,
					lasts: 'PERMANENT',
					date: new Date().toUTCString(),
				});

				this.messages.push({
					public: false,
					content: message,
					author: AVALONIST_NAME,
					to: [username],
					type: 1,
					character: 3,
					timestamp: Date.now(),
					id: Date.now(),
				});

				return {
					type: 'NONE',
				};
			} else {
				this.messages.push({
					public: false,
					content: 'This IP is not registered in the blacklist.',
					author: AVALONIST_NAME,
					to: [username],
					type: 1,
					character: 3,
					timestamp: Date.now(),
					id: Date.now(),
				});

				this.deletePastMessageLimit();

				return {
					type: 'NONE',
				};
			}
		} else {
			return this.invalidCommand(username);
		}
	}

	commandModerationLogs(username) {
		const hammer = ClientsOnline[username].profile;

		if (hammer.isMod || hammer.isAdmin) {
			this.messages.push({
				public: false,
				content: 'Moderation Logs Received. Check browser console to see logs.',
				author: AVALONIST_NAME,
				to: [username],
				type: 1,
				character: 3,
				timestamp: Date.now(),
				id: Date.now(),
			});

			return {
				type: 'LOGS',
				logs: ModLogs,
			};
		} else {
			return this.invalidCommand(username);
		}
	}

	commandDirectMessage(username, content, splitContent) {
		let hammer = ClientsOnline[username];
		let target = ClientsOnline[splitContent[1]];

		let dmContent = content.replace(splitContent[1], '');
		dmContent = splitContent[2] ? dmContent.slice(dmContent.indexOf(splitContent[2])) : '';

		if (!target) {
			this.messages.push({
				public: false,
				content: 'User with username "{user}" is currently disconnected.'.replace(/{user}/gi, splitContent[1]),
				author: AVALONIST_NAME,
				to: [username],
				type: 1,
				character: 3,
				timestamp: Date.now(),
				id: Date.now(),
			});

			this.deletePastMessageLimit();

			return {
				type: 'NONE',
			};
		}

		if (dmContent.length === 0) {
			this.messages.push({
				public: false,
				content: 'The contents of a private message cannot be empty.',
				author: AVALONIST_NAME,
				to: [username],
				type: 1,
				character: 3,
				timestamp: Date.now(),
				id: Date.now(),
			});

			this.deletePastMessageLimit();

			return {
				type: 'NONE',
			};
		}

		const hammerProfile = hammer.profile;
		const targetProfile = target.profile;

		if (hammerProfile.isMod || hammerProfile.isAdmin || targetProfile.isMod || targetProfile.isAdmin) {
			this.messages.push({
				public: false,
				content: dmContent,
				author: username,
				to: [splitContent[1]],
				type: 0,
				character: 3,
				timestamp: Date.now(),
				id: Date.now(),
			});

			return {
				type: 'DM',
				socket: target.sockets[0],
				content: dmContent,
			};
		} else {
			this.messages.push({
				public: false,
				content: 'You must be part of the moderation team to message this player.',
				author: AVALONIST_NAME,
				to: [username],
				type: 1,
				character: 3,
				timestamp: Date.now(),
				id: Date.now(),
			});

			this.deletePastMessageLimit();

			return {
				type: 'NONE',
			};
		}
	}

	commandBuzzes(username, splitContent) {
		if (username === splitContent[1]) {
			this.messages.push({
				public: false,
				content: 'You cannot do this to yourself.',
				author: AVALONIST_NAME,
				to: [username],
				type: 1,
				character: 3,
				timestamp: Date.now(),
				id: Date.now(),
			});

			this.deletePastMessageLimit();

			return {
				type: 'NONE',
			};
		}

		let target = ClientsOnline[splitContent[1]];

		let action = { '/slap': 'slapped', '/buzz': 'buzzed', '/lick': 'licked' }[splitContent[0]];

		if (!target) {
			this.messages.push({
				public: false,
				content: 'No user online exists with the provided username.'.replace(/{user}/gi, splitContent[1]),
				author: AVALONIST_NAME,
				to: [username],
				type: 1,
				character: 3,
				timestamp: Date.now(),
				id: Date.now(),
			});

			this.deletePastMessageLimit();

			return {
				type: 'NONE',
			};
		}

		if (target.profile.dontBotherMeUntilThisTime > Date.now()) {
			this.messages.push({
				public: false,
				content: 'This player has already been {action} recently by someone...'.replace(/{action}/gi, action),
				author: AVALONIST_NAME,
				to: [username],
				type: 1,
				character: 3,
				timestamp: Date.now(),
				id: Date.now(),
			});

			this.deletePastMessageLimit();

			return {
				type: 'NONE',
			};
		}

		this.messages.push({
			public: true,
			content: '{user} has {action} {target}!'
				.replace(/{user}/gi, username)
				.replace(/{target}/gi, splitContent[1])
				.replace(/{action}/gi, action),
			author: AVALONIST_NAME,
			to: [],
			type: 1,
			character: 2,
			timestamp: Date.now(),
			id: Date.now(),
		});

		target.profile.dontBotherMeUntilThisTime = Date.now() + 15000;

		return {
			type: 'BUZZ',
			action,
			socket: target.sockets[0],
		};
	}

	commandRollDie(username, splitContent) {
		let die = parseInt(splitContent[1]);

		die = isNaN(die) ? 6 : die;
		const roll = Math.floor(Math.random() * die) + 1;

		this.messages.push({
			public: false,
			content: 'You have rolled a ' + roll + '!',
			author: AVALONIST_NAME,
			to: [username],
			type: 1,
			character: 3,
			timestamp: Date.now(),
			id: Date.now(),
		});

		this.deletePastMessageLimit();

		return {
			type: 'NONE',
		};
	}

	commandFlipCoin(username) {
		let coin = Math.random() > 0.5 ? 'heads!' : 'tails!';

		this.messages.push({
			public: false,
			content: 'You flipped ' + coin,
			author: AVALONIST_NAME,
			to: [username],
			type: 1,
			character: 3,
			timestamp: Date.now(),
			id: Date.now(),
		});

		this.deletePastMessageLimit();

		return {
			type: 'NONE',
		};
	}

	commandCopyPastaGalore(username, splitContent) {
		const copyPasta = {
			'/pingerus':
				'My name is Maximus Imbaus Pingerus Meridius, Commander of the Armies of the North, General of the Felix Legions, loyal servant to the true emperor, Marcus Aurelius. Father to a murdered son, husband to a murdered wife. And I will have my vengeance, in this life or the next.',
			'/bremus':
				'My name is Maximus Bremus Menus Meridius, Commander of the Armies of the North, General of the Felix Legions, loyal servant to the true emperor, Marcus Aurelius. Father to a murdered son, husband to a murdered husband. And I will have my vengeance, in this life or the next.',
			'/fortysixpercent':
				'Max 96 your win rate is same as me at 46%. -- when you are serious about the game, and I am not. And you choose to play with only good players, but how your win rate still low like mine - sorry to say that - I mean this game is not perfect as you expect mna',
			'/poggers': 'Babe, your avalon skills are poggers...',
		};

		this.messages.push({
			public: false,
			content: copyPasta[splitContent[0]],
			author: AVALONIST_NAME,
			to: [username],
			type: 1,
			character: 3,
			timestamp: Date.now(),
			id: Date.now(),
		});

		this.deletePastMessageLimit();

		return {
			type: 'NONE',
		};
	}

	// Find Quotes (Make a better algorithm)

	findQuote(username, content) {
		let hasFoundQuote = false;

		let splitContent = content.split(/[0-9]{2}:[0-9]{2} /).map((x) => x.trim());
		splitContent = new Set(splitContent);

		for (const x in this.messages) {
			const message = this.messages[x];

			if (message.public) {
				const referent = [message.author + ':' + message.content, message.content][message.type];

				if (!splitContent.has(referent)) continue;

				splitContent.delete(referent);

				if (!hasFoundQuote) {
					const quoteContent = '{username} quotes:';

					this.messages.push({
						public: true,
						content: quoteContent.replace(/{username}/gi, username),
						author: AVALONIST_NAME,
						to: [],
						type: 1,
						character: 2,
						timestamp: Date.now(),
						id: Date.now(),
					});

					hasFoundQuote = true;
				}

				const quote = Object.assign({}, message);

				content = content.replace(quote.content, '');
				quote.character = 4;
				quote.id = Date.now();

				this.messages.push(quote);
			}
		}

		if (!hasFoundQuote) {
			this.messages.push({
				public: false,
				content: "Quote received doesn't exist.",
				author: AVALONIST_NAME,
				to: [username],
				type: 1,
				character: 3,
				timestamp: Date.now(),
				id: Date.now(),
			});
		}

		this.deletePastMessageLimit();
	}

	// User Messages

	sendMessage(username, content) {
		const zalgo = /%CC%/g;

		if (zalgo.test(encodeURIComponent(content))) {
			this.messages.push({
				public: false,
				content: 'You are trying to post a message with invalid characters. Please, refrain from doing it.',
				author: AVALONIST_NAME,
				to: [username],
				type: 1,
				character: 3,
				timestamp: Date.now(),
				id: Date.now(),
			});

			this.deletePastMessageLimit();

			return;
		}

		this.messages.push({
			public: true,
			content: content,
			author: username,
			to: [],
			type: 0,
			character: 0,
			timestamp: Date.now(),
			id: Date.now(),
		});

		this.deletePastMessageLimit();
	}

	// Lobby Messages

	joinLeaveLobby(username, joined) {
		const content = '{username} has {action} the lobby!';
		const action = joined ? 'entered' : 'left';

		this.messages.push({
			public: true,
			content: content.replace(/{username}/gi, username).replace(/{action}/gi, action),
			author: AVALONIST_NAME,
			to: [],
			type: 1,
			character: 2,
			timestamp: Date.now(),
			id: Date.now(),
		});

		this.deletePastMessageLimit();
	}

	roomCreated(username, no) {
		const content = '{username} has created Room #{no}! Join now!';

		this.messages.push({
			public: true,
			content: content.replace(/{username}/gi, username).replace(/{no}/gi, no),
			author: AVALONIST_NAME,
			to: [],
			type: 1,
			character: 2,
			timestamp: Date.now(),
			id: Date.now(),
		});

		this.deletePastMessageLimit();
	}

	roomFinished(no, winner) {
		const content = 'Game #{no} has finished! {outcome}!';
		const outcome = winner ? 'The Resistance Wins' : 'The Spies Win';

		this.messages.push({
			public: true,
			content: content.replace(/{no}/gi, no).replace(/{outcome}/gi, outcome),
			author: AVALONIST_NAME,
			to: [],
			type: 1,
			character: winner ? 1 : -1,
			timestamp: Date.now(),
			id: Date.now(),
		});

		this.deletePastMessageLimit();
	}

	// Game Message

	onEnter(username, joined) {
		const content = '{username} has {action} the room!';
		const action = joined ? 'joined' : 'left';

		this.messages.push({
			public: true,
			content: content.replace(/{username}/gi, username).replace(/{action}/gi, action),
			author: AVALONIST_NAME,
			to: [],
			type: 1,
			character: 2,
			timestamp: Date.now(),
			id: Date.now(),
		});

		this.deletePastMessageLimit();
	}

	onStart(roleSettings, no) {
		const arr = [];

		if (roleSettings.merlin) arr.push('Merlin');
		if (roleSettings.percival) arr.push('Percival');
		if (roleSettings.morgana) arr.push('Morgana');
		if (roleSettings.assassin) arr.push('Assassin');
		if (roleSettings.oberon) arr.push('Oberon');
		if (roleSettings.mordred) arr.push('Mordred');
		if (roleSettings.card) arr.push('Lady of the Lake');
		if (arr.length < 1) arr.push('No special roles');

		const content = 'Room #{no} starts with: {info}.';
		const info = arr.toString().replace(/,/g, ', ');

		this.messages.push({
			public: true,
			content: content.replace(/{no}/gi, no).replace(/{info}/gi, info),
			author: AVALONIST_NAME,
			to: [],
			type: 1,
			character: 2,
			timestamp: Date.now(),
			id: Date.now(),
		});

		this.deletePastMessageLimit();
	}

	onPick(username) {
		const content = 'Waiting for {username} to select a team!';

		this.messages.push({
			public: true,
			content: content.replace(/{username}/gi, username),
			author: AVALONIST_NAME,
			to: [],
			type: 1,
			character: 2,
			timestamp: Date.now(),
			id: Date.now(),
		});

		this.deletePastMessageLimit();
	}

	afterPick(mission, round, team) {
		const content = 'Mission {mission}.{round} picked: {team}';
		const content2 = 'Everybody vote!';

		this.messages.push(
			{
				public: true,
				content: content
					.replace(/{mission}/gi, mission)
					.replace(/{round}/gi, round)
					.replace(/{team}/gi, team),
				author: AVALONIST_NAME,
				to: [],
				type: 1,
				character: 2,
				timestamp: Date.now(),
				id: Date.now(),
			},
			{
				public: true,
				content: content2,
				author: AVALONIST_NAME,
				to: [],
				type: 1,
				character: 2,
				timestamp: Date.now(),
				id: Date.now(),
			}
		);

		this.deletePastMessageLimit();
	}

	afterVote(mission, round, passes) {
		const content = 'Everybody has voted! Mission {mission}.{round} has been {result}.';
		const result = passes ? 'approved' : 'rejected';

		this.messages.push({
			public: true,
			content: content
				.replace(/{mission}/gi, mission)
				.replace(/{round}/gi, round)
				.replace(/{result}/gi, result),
			author: AVALONIST_NAME,
			to: [],
			type: 1,
			character: 2,
			timestamp: Date.now(),
			id: Date.now(),
		});

		this.deletePastMessageLimit();
	}

	afterPassing(team) {
		const content = 'Waiting for {team} to choose the fate of this mission.';

		this.messages.push({
			public: true,
			content: content.replace(/{team}/gi, team),
			author: AVALONIST_NAME,
			to: [],
			type: 1,
			character: 2,
			timestamp: Date.now(),
			id: Date.now(),
		});

		this.deletePastMessageLimit();
	}

	afterMission(mission, fails, success) {
		const content =
			fails !== 1
				? 'Mission {mission} has {outcome} with {fails} fails!'
				: 'Mission {mission} has {outcome} with 1 fail!';
		const outcome = success ? 'succeeded' : 'failed';

		this.messages.push({
			public: true,
			content: content
				.replace(/{mission}/gi, mission)
				.replace(/{outcome}/gi, outcome)
				.replace(/{fails}/gi, fails),
			author: AVALONIST_NAME,
			to: [],
			type: 1,
			character: success ? 1 : -1,
			timestamp: Date.now(),
			id: Date.now(),
		});

		this.deletePastMessageLimit();
	}

	waitingForShot(player) {
		const content = 'Waiting for {player} to select a target!';

		this.messages.push({
			public: true,
			content: content.replace(/{player}/gi, player),
			author: AVALONIST_NAME,
			to: [],
			type: 1,
			character: 2,
			timestamp: Date.now(),
			id: Date.now(),
		});

		this.deletePastMessageLimit();
	}

	afterShot(player) {
		const content = '{player} was shot!';

		this.messages.push({
			public: true,
			content: content.replace(/{player}/gi, player),
			author: AVALONIST_NAME,
			to: [],
			type: 1,
			character: 2,
			timestamp: Date.now(),
			id: Date.now(),
		});

		this.deletePastMessageLimit();
	}

	waitingForCard(player) {
		const content = 'Waiting for {player} to use Lady of the Lake!';

		this.messages.push({
			public: true,
			content: content.replace(/{player}/gi, player),
			author: AVALONIST_NAME,
			to: [],
			type: 1,
			character: 2,
			timestamp: Date.now(),
			id: Date.now(),
		});

		this.deletePastMessageLimit();
	}

	afterCard(player, carded, isSpy) {
		const content = '{player} has used Lady of the Lake on {carded}!';
		const content2 = '{carded} is {result}!';
		const result = isSpy ? 'a Spy' : 'a member of The Resistance';

		this.messages.push(
			{
				public: true,
				content: content.replace(/{player}/gi, player).replace(/{carded}/gi, carded),
				author: AVALONIST_NAME,
				to: [],
				type: 1,
				character: 2,
				timestamp: Date.now(),
				id: Date.now(),
			},
			{
				public: false,
				content: content2.replace(/{result}/gi, result).replace(/{carded}/gi, carded),
				author: AVALONIST_NAME,
				to: [player],
				type: 1,
				character: isSpy ? -1 : 1,
				timestamp: Date.now(),
				id: Date.now(),
			}
		);

		this.deletePastMessageLimit();
	}

	onEnd(no, cause, winner) {
		const content = 'Game #{no} has finished!';
		const content2 = [
			'Merlin has been killed! The Spies Win.',
			'Merlin was not killed! The Resistance wins.',
			'Three missions have failed! The Spies Win.',
			'Mission hammer was rejected! The Spies Win.',
			'Three missions have succeeded! The Resistance wins.',
		][cause];

		this.messages.push(
			{
				public: true,
				content: content.replace(/{no}/gi, no),
				author: AVALONIST_NAME,
				to: [],
				type: 1,
				character: winner ? 1 : -1,
				timestamp: Date.now(),
				id: Date.now(),
			},
			{
				public: true,
				content: content2,
				author: AVALONIST_NAME,
				to: [],
				type: 1,
				character: winner ? 1 : -1,
				timestamp: Date.now(),
				id: Date.now(),
			}
		);

		this.deletePastMessageLimit();
	}

	kickPlayer(host, player) {
		const content = '{player} has been kicked by {host}!';

		this.messages.push({
			public: true,
			content: content.replace(/{player}/gi, player).replace(/{host}/gi, host),
			author: AVALONIST_NAME,
			to: [],
			type: 1,
			character: -1,
			timestamp: Date.now(),
			id: Date.now(),
		});

		this.deletePastMessageLimit();
	}
}

module.exports = Chat;
