const ClientsOnline = require('../auth/presence').clients;
const Profile = require('../profile/profile');

const IpTree = require('../parse/ip-tree');
const GlobalEnvironment = require('../parse/globals');
const DiscordReports = require('../parse/discord-webhook');

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

	// Removes this chat from the global chat list

	removeFromChatList() {
		const index = ChatList.indexOf(this);

		if (index > -1) {
			ChatList.splice(index, 1);
		}
	}

	// Adds a moderation log to the server

	async addModLog(log) {
		ModLogs.push(log);

		const main = await GlobalEnvironment();

		const logs = main.get('modLogs');
		logs.push(log);

		main.set('modLogs', logs);

		main.save({}, { useMasterKey: true });
	}

	// Delete messages past the message limit

	deletePastMessageLimit() {
		while (this.messages.length > this.limit) this.messages.shift();
	}

	// Find Quotes

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
					this.messages.push({
						public: true,
						content: `${username} quotes:`,
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
			content,
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
		const action = joined ? 'entered' : 'left';

		this.messages.push({
			public: true,
			content: `${username} has ${action} the lobby.`,
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
		this.messages.push({
			public: true,
			content: `${username} has created Room ${no}.`,
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
		const outcome = winner ? 'The Resistance Wins' : 'The Spies Win';

		this.messages.push({
			public: true,
			content: `Game ${no} has finished. ${outcome}.`,
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
		const action = joined ? 'joined' : 'left';

		this.messages.push({
			public: true,
			content: `${username} has ${action} the room.`,
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

		const roles = {
			merlin: 'Merlin',
			percival: 'Percival',
			morgana: 'Morgana',
			assassin: 'Assassin',
			oberon: 'Oberon',
			mordred: 'Mordred',
			card: 'Lady of the Lake',
			empty: 'No special roles',
		}

		for (const role in roleSettings) {
			arr.push(roles[role].charAt(0).toUpperCase() + role.slice(1));
		}

		if (arr.length < 1) arr.push(roles.empty);

		this.messages.push({
			public: true,
			content: `Room ${no} starts with: ${arr.join(', ')}.`,
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
		this.messages.push({
			public: true,
			content: `Waiting for ${username} to select a team.`,
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
		this.messages.push(
			{
				public: true,
				content: `Mission ${mission}.${round} picked: ${team}`,
				author: AVALONIST_NAME,
				to: [],
				type: 1,
				character: 2,
				timestamp: Date.now(),
				id: Date.now(),
			},
			{
				public: true,
				content: 'Everybody vote!',
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
		const result = passes ? 'approved' : 'rejected';

		this.messages.push({
			public: true,
			content: `Everybody has voted! Mission ${mission}.${round} has been ${result}.`,
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

		this.messages.push({
			public: true,
			content: `Waiting for ${team} to choose the fate of this mission.`,
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
		const outcome = success ? 'succeeded' : 'failed';

		let content = `Mission ${mission} has ${outcome} `;

		content += fails === 1
			? `with ${fails} fail`
			:	`with ${fails} fails`;

		content += '.';

		this.messages.push({
			public: true,
			content,
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
		this.messages.push({
			public: true,
			content: `Waiting for ${player} to select a target.`,
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
		this.messages.push({
			public: true,
			content: `${player} was shot!`,
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
		this.messages.push({
			public: true,
			content: `Waiting for ${player} to use Lady of the Lake.`,
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
		const result = isSpy ? 'a Spy' : 'a member of The Resistance';

		this.messages.push(
			{
				public: true,
				content: `${player} has used Lady of the Lake on ${carded}!`,
				author: AVALONIST_NAME,
				to: [],
				type: 1,
				character: 2,
				timestamp: Date.now(),
				id: Date.now(),
			},
			{
				public: false,
				content: `${carded} is ${result}!`,
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
		const content = `Game ${no} has finished!`;
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
				content,
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

	onVoid(no) {
		const content = `Room ${no} has been voided!`;

		this.messages.push({
			public: true,
			content,
			author: AVALONIST_NAME,
			to: [],
			type: 1,
			character: -1,
			timestamp: Date.now(),
			id: Date.now(),
		});

		this.deletePastMessageLimit();
	}

	kickPlayer(host, player) {
		const content = `${player} has been kicked by ${host}!`;

		this.messages.push({
			public: true,
			content,
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

class ChatCommands extends Chat {
	async parseCommand(username, content) {
		const splitContent = content.split(' ');

		switch (splitContent[0]) {
			case '/help':
				return this.commandHelp(username, splitContent[1]);
			case '/ss':
			case '/unss':
			case '/ban':
			case '/unban':
			case '/banip':
				return await this.commandModAction(username, splitContent);
			case '/unbanip':
				return await this.commandUnbanIp(username, splitContent);
			case '/logs':
				return await this.commandModerationLogs(username, false);
			case '/logsall':
				return await this.commandModerationLogs(username, true);
			case '/adminmode':
				return await this.commandAdminMode(username);
			case '/close':
			case '/pause':
			case '/unpause':
			case '/learnroles':
			case '/end':
				return this.commandGameAction(username, splitContent);
			case '/aveset':
				return await this.commandAveSet(username, splitContent, true);
			case '/discordset':
				return await this.commandDiscordSet(username, splitContent);
			case '/dm':
				return this.commandDirectMessage(username, content, splitContent);
			case '/slap':
			case '/buzz':
			case '/lick':
				return this.commandBuzzes(username, splitContent);
			case '/roll':
				return this.commandRollDie(username, splitContent);
			case '/flip':
				return this.commandFlipCoin(username);
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
			content: 'Invalid Command. Try /help {page} for a list of commands.',
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

	commandHelp(username, page) {
		const caller = ClientsOnline[username].profile;
		const mod = caller.isMod || caller.isAdmin;
		const pageMax = mod ? 5 : 2;

		page = parseInt(page);
		page = isNaN(page) || page < 1 || page > pageMax ? 1 : page;

		const helpMod = {
			1: [
				'Moderation Actions',
				"/ss {player} {hours?} - Enacts a temporary suspension on the given player's account.",
				"/unss {player} - Lifts a temporary suspension from the given player's account.",
				"/ban {player} - Enacts a permanent ban on the given player's account.",
				"/unban {player} - Lifts a permanent ban from the given player's account.",
				"/banip {player} - Enacts a permanent ban on the given player's account and its correspondent IPs.",
				'/unbanip {ip} - Lifts a permanent ban on the given IP address.',
				'/logs - Retrieves moderation logs of the current session and prints them in browser console.',
				'/logsall - Retrieves a full history of moderation logs and prints them in browser console.',
				'/adminmode - Toggles the maintenance feature of the site. It will disconnect everyone if its currently on maintenance.',
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

		const helpMessages = mod ? helpMod[page] : helpClient[page];

		const author = `Command Help > Page ${page}/${pageMax}`;

		for (const x in helpMessages) {
			this.messages.push({
				public: false,
				content: helpMessages[x],
				author,
				to: [username],
				type: x === '0' ? 2 : 1,
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
							hours === 1 ? `${profile.user} has been suspended for 1 hour.` : `${profile.user} has been for suspended for ${hours} hours.`;

						this.addModLog({
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

						message = `${profile.user} has been unsuspended.`;

						this.addModLog({
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

						message = `${profile.user} has been banned.`;

						this.addModLog({
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

						message = `${profile.user} has been unbanned.`;

						this.addModLog({
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

						message = `${profile.user} has been banned and all of their IP adresses have been locked.`;

						this.addModLog({
							action: 'IP BAN',
							moderator: username,
							target: profile.user,
							lasts: 'PERMANENT',
							ips,
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

				let message = `${ip} has been removed from the IP blacklist.`;

				this.addModLog({
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

	async commandModerationLogs(username, all) {
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
				logs: all ? (await GlobalEnvironment()).get('modLogs') : ModLogs,
			};
		} else {
			return this.invalidCommand(username);
		}
	}

	async commandAdminMode(username, splitContent, gummy) {
		const hammer = ClientsOnline[username].profile;

		if (hammer.isMod || hammer.isAdmin) {
			const main = await GlobalEnvironment();

			const admin = main.get('adminMode');

			main.set('adminMode', !admin);
			await main.save({}, { useMasterKey: true });

			this.addModLog({
				action: 'ADMIN MODE',
				moderator: username,
				status: !admin,
				date: new Date().toUTCString(),
			});

			this.messages.push({
				public: false,
				content: 'Admin Mode has been toggled.',
				author: AVALONIST_NAME,
				to: [username],
				type: 1,
				character: 3,
				timestamp: Date.now(),
				id: Date.now(),
			});

			return {
				type: 'RECONNECT',
			};
		} else {
			return this.invalidCommand(username);
		}
	}

	commandGameAction(username, splitContent) {
		const hammer = ClientsOnline[username].profile;

		if (hammer.isMod || hammer.isAdmin) {
			try {
				const handler = new RoomHandler(splitContent[1]);
				const room = handler.getRoom();
				let message = '';

				switch (splitContent[0]) {
					case '/close':
						handler.deleteRoom();

						message = `Room ${splitContent[1]} has been closed.`;

						this.addModLog({
							action: 'CLOSE ROOM',
							moderator: username,
							target: 'Room #' + splitContent[1],
							date: new Date().toUTCString(),
						});

						break;
					case '/pause':
						if (!room.game.started) {
							this.messages.push({
								public: false,
								content: "Game hasn't started yet.",
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

						room.actions.frozen = true;

						message = `Room ${splitContent[1]} has been paused.`;

						this.addModLog({
							action: 'PAUSE ROOM',
							moderator: username,
							target: 'Room #' + splitContent[1],
							date: new Date().toUTCString(),
						});

						break;
					case '/unpause':
						if (!room.game.started) {
							this.messages.push({
								public: false,
								content: "Game hasn't started yet.",
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

						room.actions.frozen = false;

						message = `Room ${splitContent[1]} has been unpaused.`;

						this.addModLog({
							action: 'UNPAUSE ROOM',
							moderator: username,
							target: 'Room #' + splitContent[1],
							date: new Date().toUTCString(),
						});

						break;
					case '/learnroles':
						if (!room.game.started) {
							this.messages.push({
								public: false,
								content: "Game hasn't started yet.",
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

						room.game.privateKnowledge[username] = room.game.roles;

						message = `Learned roles in Room ${splitContent[1]}.`;

						this.addModLog({
							action: 'LEARN ROLES',
							moderator: username,
							target: 'Room #' + splitContent[1],
							date: new Date().toUTCString(),
						});

						break;
					case '/end':
						if (!room.game.started) {
							this.messages.push({
								public: false,
								content: "Game hasn't started yet.",
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

						let outcome = -1;

						if (splitContent[2] === '1') outcome = 4;
						if (splitContent[2] === '0') outcome = 2;

						if (outcome !== -1) {
							room.actions.gameEnd(outcome);
							handler.gameEndProtocol();
						} else {
							room.actions.voidGame(outcome);
						}

						message = `Room ${splitContent[1]} has been ended.`;

						this.addModLog({
							action: 'END ROOM',
							moderator: username,
							target: 'Room #' + splitContent[1],
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

				this.deletePastMessageLimit();

				return {
					type: 'GAME',
					room: splitContent[1],
				};
			} catch (err) {
				console.log(err);

				this.messages.push({
					public: false,
					content: 'No game was found.',
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

	async commandAveSet(username, splitContent, gummy) {
		const hammer = ClientsOnline[username].profile;

		if (hammer.isMod || hammer.isAdmin) {
			const mainPromise = GlobalEnvironment();
			const profile = await new Profile(splitContent[1]).getFromUser();
			const main = await mainPromise;

			if (profile) {
				let target = ClientsOnline[profile.user];

				profile.avatarGummy = {
					res: splitContent[2],
					spy: splitContent[3],
				};
				profile.avatarClassic = {
					res: splitContent[2],
					spy: splitContent[3],
				};

				profile.saveToUser();

				const aves = main.get('latestAvatars');

				aves.push(splitContent[2]);
				aves.shift();

				main.set('latestAvatars', aves);
				main.save({}, { useMasterKey: true });

				const message = `${profile.user}'s avatars have been set.`;

				this.addModLog({
					action: 'AVATAR SET',
					moderator: username,
					target: profile.user,
					avatarType: 'All Avatars',
					resLink: splitContent[2],
					spyLink: splitContent[3],
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
					content: 'No user exists with the provided username.',
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

	async commandDiscordSet(username, splitContent, gummy) {
		const hammer = ClientsOnline[username].profile;

		if (hammer.isMod || hammer.isAdmin) {
			const main = await GlobalEnvironment();

			const url = splitContent[1];

			main.set('discordWebhook', url);

			DiscordReports.newHook(url);

			await main.save({}, { useMasterKey: true });

			this.addModLog({
				action: 'DISCORD SET',
				moderator: username,
				url,
				date: new Date().toUTCString(),
			});

			this.messages.push({
				public: false,
				content: 'New Discord Webhook URL set.',
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
			return this.invalidCommand(username);
		}
	}

	commandDirectMessage(username, content, splitContent) {
		let hammer = ClientsOnline[username];
		let target = ClientsOnline[splitContent[1]];

		let dmContent = content.replace(splitContent[1], '');
		dmContent = splitContent[2] ? dmContent.slice(dmContent.indexOf(splitContent[2])) : '';

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

			return {
				type: 'NONE',
			};
		}

		if (!target) {
			this.messages.push({
				public: false,
				content: `User with username "${splitContent[1]}" is currently disconnected.`,
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

			this.addModLog({
				action: 'DM',
				sender: username,
				target: splitContent[1],
				content: dmContent,
				date: new Date().toUTCString(),
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
				content: `No ${splitContent[1]} online exists with the provided username.`,
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
				content: `This player has already been ${action} recently by someone...`,
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
			content: `${username} has ${splitContent[1]} ${action}!`,
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
}

module.exports = ChatCommands;

const RoomHandler = require('../game/room-handler');

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
