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

const AVALONIST_NAME = 'AvalonistServerMessage';

class Chat {
	constructor(limit) {
		this.messages = [];
		this.limit = limit;
	}

	// Delete messages past the message limit

	deletePastMessageLimit() {
		while (this.messages.length > this.limit) this.messages.shift();
	}

	// User Commands

	async parseCommand(username, content) {
		const splitContent = content.split(' ');

		const hammer = ClientsOnline[username].profile;

		switch (splitContent[0]) {
			case '/help':
				const helpMessages = [
					'List of Commands:',
					"/ss {player} {hours} - Enacts a temporary suspension on the given player's account.",
					"/unss {player} - Lifts a temporary suspension from the given player's account.",
					"/ban {player} - Enacts a permanent ban on the given player's account.",
					"/unban {player} - Lifts a permanent ban from the given player's account.",
					"/banip {player} - Enacts a permanent ban on the given player's account and its correspondent IPs.",
					'/unbanip {ip} - Lifts a permanent ban on the given IP adress.',
					'/dm {player} {message} - Sends a direct message to the given player. Direct messages are moderated.',
					'/roll {sides?} - Rolls a die. Provide a number to change the number of sides.',
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
				break;
			case '/ss':
				if (hammer.isMod || hammer.isAdmin) {
					const profile = await new Profile(splitContent[1]).getFromUser();

					if (profile && !profile.isAdmin && !profile.isMod) {
						await profile.closeAllOpenSessions();

						let hours = parseFloat(splitContent[2]);
						hours = isNaN(hours) ? 1 : hours;
						profile.suspensionDate = Date.now() + hours * 3600000;
						profile.saveToUser();

						this.messages.push({
							public: false,
							content: profile.user + ' has been suspended for ' + hours + ' hours.',
							author: AVALONIST_NAME,
							to: [username],
							type: 1,
							character: 3,
							timestamp: Date.now(),
							id: Date.now(),
						});

						const target = ClientsOnline[profile.user];

						return {
							type: 'BAN',
							sockets: target ? target.sockets : [],
						};
					} else {
						this.messages.push({
							public: false,
							content: 'No user exists with the provided username, or the user holds a power position.',
							author: AVALONIST_NAME,
							to: [username],
							type: 1,
							character: 3,
							timestamp: Date.now(),
							id: Date.now(),
						});
						break;
					}
				} else {
					this.messages.push({
						public: false,
						content: 'You must be a member of the moderation team to perform this command.',
						author: AVALONIST_NAME,
						to: [username],
						type: 1,
						character: 3,
						timestamp: Date.now(),
						id: Date.now(),
					});
					break;
				}
			case '/unss':
				if (hammer.isMod || hammer.isAdmin) {
					const profile = await new Profile(splitContent[1]).getFromUser();

					if (profile && !profile.isAdmin && !profile.isMod) {
						profile.suspensionDate = 0;
						profile.saveToUser();

						this.messages.push({
							public: false,
							content: profile.user + ' has been unsuspended.',
							author: AVALONIST_NAME,
							to: [username],
							type: 1,
							character: 3,
							timestamp: Date.now(),
							id: Date.now(),
						});

						const target = ClientsOnline[profile.user];

						return {
							type: 'BAN',
							sockets: target ? target.sockets : [],
						};
					} else {
						this.messages.push({
							public: false,
							content: 'No user exists with the provided username, or the user holds a power position.',
							author: AVALONIST_NAME,
							to: [username],
							type: 1,
							character: 3,
							timestamp: Date.now(),
							id: Date.now(),
						});
						break;
					}
				} else {
					this.messages.push({
						public: false,
						content: 'You must be a member of the moderation team to perform this command.',
						author: AVALONIST_NAME,
						to: [username],
						type: 1,
						character: 3,
						timestamp: Date.now(),
						id: Date.now(),
					});
					break;
				}
			case '/ban':
				if (hammer.isMod || hammer.isAdmin) {
					const profile = await new Profile(splitContent[1]).getFromUser();

					if (profile && !profile.isAdmin && !profile.isMod) {
						await profile.closeAllOpenSessions();

						profile.isBanned = true;
						profile.saveToUser();

						this.messages.push({
							public: false,
							content: profile.user + ' has been banned.',
							author: AVALONIST_NAME,
							to: [username],
							type: 1,
							character: 3,
							timestamp: Date.now(),
							id: Date.now(),
						});

						const target = ClientsOnline[profile.user];

						return {
							type: 'BAN',
							sockets: target ? target.sockets : [],
						};
					} else {
						this.messages.push({
							public: false,
							content: 'No user exists with the provided username, or the user holds a power position.',
							author: AVALONIST_NAME,
							to: [username],
							type: 1,
							character: 3,
							timestamp: Date.now(),
							id: Date.now(),
						});
						break;
					}
				} else {
					this.messages.push({
						public: false,
						content: 'You must be a member of the moderation team to perform this command.',
						author: AVALONIST_NAME,
						to: [username],
						type: 1,
						character: 3,
						timestamp: Date.now(),
						id: Date.now(),
					});
					break;
				}
			case '/unban':
				if (hammer.isMod || hammer.isAdmin) {
					const profile = await new Profile(splitContent[1]).getFromUser();

					if (profile && !profile.isAdmin && !profile.isMod) {
						profile.isBanned = false;
						profile.saveToUser();

						this.messages.push({
							public: false,
							content: profile.user + ' has been unbanned.',
							author: AVALONIST_NAME,
							to: [username],
							type: 1,
							character: 3,
							timestamp: Date.now(),
							id: Date.now(),
						});

						const target = ClientsOnline[profile.user];

						return {
							type: 'BAN',
							sockets: target ? target.sockets : [],
						};
					} else {
						this.messages.push({
							public: false,
							content: 'No user exists with the provided username, or the user holds a power position.',
							author: AVALONIST_NAME,
							to: [username],
							type: 1,
							character: 3,
							timestamp: Date.now(),
							id: Date.now(),
						});
						break;
					}
				} else {
					this.messages.push({
						public: false,
						content: 'You must be a member of the moderation team to perform this command.',
						author: AVALONIST_NAME,
						to: [username],
						type: 1,
						character: 3,
						timestamp: Date.now(),
						id: Date.now(),
					});
					break;
				}
			case '/dm':
				let dmContent = content.replace(splitContent[1], '');
				dmContent = dmContent.slice(dmContent.indexOf(splitContent[2]));
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
				};
			case '/roll':
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
				break;
			case '/flip':
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
				break;
			case '/poggers':
				this.messages.push({
					public: false,
					content: 'Babe, your avalon skills are poggers...',
					author: AVALONIST_NAME,
					to: [username],
					type: 1,
					character: 3,
					timestamp: Date.now(),
					id: Date.now(),
				});
				break;
			case '/bremus':
				this.messages.push({
					public: false,
					content:
						'My name is Maximus Bremus Menus Meridius, Commander of the Armies of the North, General of the Felix Legions, loyal servant to the true emperor, Marcus Aurelius. Father to a murdered son, husband to a murdered husband. And I will have my vengeance, in this life or the next.',
					author: AVALONIST_NAME,
					to: [username],
					type: 1,
					character: 3,
					timestamp: Date.now(),
					id: Date.now(),
				});
				break;
			case '/pingerus':
				this.messages.push({
					public: false,
					content:
						'My name is Maximus Imbaus Pingerus Meridius, Commander of the Armies of the North, General of the Felix Legions, loyal servant to the true emperor, Marcus Aurelius. Father to a murdered son, husband to a murdered wife. And I will have my vengeance, in this life or the next.',
					author: AVALONIST_NAME,
					to: [username],
					type: 1,
					character: 3,
					timestamp: Date.now(),
					id: Date.now(),
				});
				break;
			case '/fortysixpercent':
				this.messages.push({
					public: false,
					content:
						'Max 96 your win rate is same as me at 46%. -- when you are serious about the game, and I am not. And you choose to play with only good players, but how your win rate still low like mine - sorry to say that - I mean this game is not perfect as you expect mna',
					author: AVALONIST_NAME,
					to: [username],
					type: 1,
					character: 3,
					timestamp: Date.now(),
					id: Date.now(),
				});
				break;
			default:
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
				break;
		}

		this.deletePastMessageLimit();
		return {
			type: 'NONE',
		};
	}

	findQuote(username, content) {
		let hasFoundQuote = false;

		for (const x in this.messages) {
			const message = this.messages[x];

			if (message.public && content.includes(message.content)) {
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
