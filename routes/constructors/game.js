/* global Parse, Set */
const Chat = require('./chat');

const playerMatrix = [
	[2, 3, 2, 3, 3],
	[2, 3, 4, 3, 4],
	[2, 3, 3, 4, 4],
	[3, 4, 4, 5, 5],
	[3, 4, 4, 5, 5],
	[3, 4, 4, 5, 5],
];

class Game extends Parse.Object {
	constructor(props) {
		super('Game');
		const { code } = props;

		// Meta
		this.set('code', code);
		this.set('host', 'Anonymous');
		this.set('mode', 'Unrated');
		this.set('listed', true);

		// Players
		this.set('playerList', []);
		this.set('playerMax', 6);
		this.set('spectatorList', {});
		this.set('kickedPlayers', []);

		// Roles
		this.set('roleList', []);
		this.set('roleSettings', {
			merlin: true,
			percival: true,
			morgana: true,
			assassin: true,
			oberon: false,
			mordred: false,
			lady: false,
		});
		this.set('hasAssassin', true);
		this.set('hasLady', false);

		// Knowledge
		this.set('publicKnowledge', new Array(10).fill('Resistance?'));
		this.set('privateKnowledge', {});

		// State
		this.set('active', true);
		this.set('started', false);
		this.set('ended', false);
		this.set('frozen', false);
		this.set('stage', 'NONE');

		// Result
		this.set('cause', -1);
		this.set('winner', -1);

		// Mission Votes
		this.set('picks', []);
		this.set('picksYetToVote', []);
		this.set('pickNames', []);
		this.set('votesRound', []);
		this.set('votesMission', []);

		// Positions
		this.set('leader', 0);
		this.set('lady', -1);
		this.set('hammer', -1);
		this.set('hammerDistance', 4);
		this.set('assassination', -1);

		// Turn
		this.set('mission', 0);
		this.set('round', 0);
		this.set('fails', 0);

		// Chat
		this.set('chat', new Chat({ code: code }));

		// Mission History
		this.set('missionResults', []);
		this.set('missionPicks', [[], [], [], [], []]);
		this.set('missionVotes', [[], [], [], [], []]);
		this.set('missionLeader', [[], [], [], [], []]);

		// Card Holders
		this.set('ladyHolders', []);
	}

	shuffleArray(array) {
		let currentIndex = array.length;

		let temporaryValue = '';
		let randomIndex = 0;

		// While there remain elements to shuffle
		while (0 !== currentIndex) {
			// Pick a remaining element
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;
			// And swap it with the current element
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		return array;
	}

	editSettings(data) {
		const { roleSettings, playerMax } = data;
		const { length } = this.get('playerList');

		// Set player max
		// Minimum is 5 and maximum is 10
		// If number is less than player count then do nothing
		const newMax = Math.min(Math.max(length, playerMax, 5), 10);

		this.set('playerMax', newMax);

		// Prepares for role setting
		const resRoles = new Array(6).fill('Resistance');
		const spyRoles = new Array(4).fill('Spy');

		let { merlin, percival, morgana, assassin, oberon, mordred, lady } = roleSettings;

		// Set mordred
		if (mordred) {
			spyRoles.push('Mordred');
			spyRoles.shift();

			mordred = true;
		} else {
			mordred = false;
		}

		// Set oberon
		if (oberon) {
			spyRoles.push('Oberon');
			spyRoles.shift();

			oberon = true;
		} else {
			oberon = false;
		}

		// Set percival and morgana
		if (percival && morgana) {
			resRoles.push('Percival');
			resRoles.shift();

			spyRoles.push('Morgana');
			spyRoles.shift();

			percival = true;
			morgana = true;
		} else {
			percival = false;
			morgana = false;
		}

		// Set merlin and assassin
		if (merlin && assassin) {
			resRoles.push('Merlin');
			resRoles.shift();

			spyRoles.push('Assassin');
			spyRoles.shift();

			merlin = true;
			assassin = true;

			this.set('hasAssassin', true);
		} else {
			merlin = false;
			assassin = false;

			this.set('hasAssassin', false);
		}

		// Set lady of the lake
		if (lady) {
			lady = true;
		} else {
			lady = false;
		}

		this.set('hasLady', lady);

		// Save to database
		const newSettings = {
			merlin,
			percival,
			morgana,
			assassin,
			oberon,
			mordred,
			lady,
		};
		const newRoles = [
			// 5p
			resRoles[5],
			resRoles[4],
			resRoles[3],
			spyRoles[3],
			spyRoles[2],
			// 6p to 10p
			resRoles[2],
			spyRoles[1],
			resRoles[1],
			spyRoles[0],
			resRoles[0],
		];

		this.set('roleSettings', newSettings);
		this.set('roleList', newRoles);

		this.save({}, { useMasterKey: true });

		return true;
	}

	addClient(data) {
		const { username, instance, id } = data;
		const spectatorList = this.get('spectatorList');

		const tag = `${instance}.${id}`;

		const client = spectatorList[username];

		if (!client) {
			spectatorList[username] = {
				timestamp: Date.now(),
				sockets: [tag],
			};
		} else if (!client.sockets.includes(tag)) {
			client.sockets.push(tag);
		}

		this.set('spectatorList', spectatorList);

		this.save({}, { useMasterKey: true });

		return true;
	}

	removeClient(data) {
		const { username, instance, id } = data;

		const room = this.get('code');
		const spectatorList = this.get('spectatorList');

		const tag = `${instance}.${id}`;

		const client = spectatorList[username];

		if (!client) {
			console.log(`${username} asked to leave Room #${room} but request failed.`);
		} else {
			const sockets = client.sockets;

			const index = sockets.indexOf(tag);
			if (index > -1) sockets.splice(index, 1);

			const { length } = sockets;

			if (length === 0) {
				const started = this.get('started');

				// If sockets are empty, then there are no connections for this client,
				// so remove it from the object so we can reap the room. If the client
				// reconnects, they will be readded to the clients objects anyways.
				delete spectatorList[username];

				if (!started) {
					this.togglePlayer({ username, add: false });
				}
			}

			// If no more clients, then delete the room.
			if (Object.keys(spectatorList).length === 0) {
				this.set('active', false);
			}
		}

		this.set('spectatorList', spectatorList);

		this.save({}, { useMasterKey: true });

		return true;
	}

	togglePlayer(data) {
		const { username, add } = data;

		const players = this.get('playerList');
		const playerMax = this.get('playerMax');

		const playerSet = new Set(players);

		const has = playerSet.has(username);

		if (has) {
			players.delete(username);
		} else if (add && players.length < playerMax) {
			players.add(username);
		}

		const playersNew = [...playerSet];

		this.set('host', playersNew[0]);
		this.set('playerList', playersNew);

		this.save({}, { useMasterKey: true });

		return true;
	}

	async startGame(data) {
		const { username } = data;
		const { shuffleArray } = this;

		const host = this.get('host');

		let players = this.get('playerList');
		const { length } = players;

		let roles = this.get('roleList').slice(0, length);

		// Condition
		const canStart = host === username && length >= 5;
		if (!canStart) return false;

		// Start the game

		players = shuffleArray(players);
		roles = shuffleArray(roles);

		this.setRoleKnowledge({ players, length, roles });

		// Chat
		const chat = this.get('chat');
		const settings = this.get('roleSettings');
		const code = this.get('code');
		await chat.fetch();

		chat.onStart({ settings, code });

		// Lady
		const hasLady = this.get('hasLady');
		const leader = Math.floor(Math.random() * length);
		const lady = (leader + length) % length;

		if (hasLady) this.set('lady', lady);

		// Set everything
		this.set('leader', leader);
		this.set('playerList', players);
		this.set('roleList', roles);
		this.set('started', true);

		this.save({}, { useMasterKey: true });

		return true;
	}

	setRoleKnowledge(data) {
		const { players, length, roles } = data;

		const publicKnowledge = this.get('publicKnowledge').slice(0, length);
		const privateKnowledge = {};

		const merlin = roles.indexOf('Merlin');
		const morgana = roles.indexOf('Morgana');

		const seemResToMerlin = ['Resistance', 'Percival', 'Merlin', 'Mordred'];
		const seemResToSpy = ['Resistance', 'Percival', 'Merlin', 'Oberon'];

		roles.forEach((role, index, array) => {
			const username = players[index];
			let knowledge = [...publicKnowledge];

			switch (role) {
				default:
					break;
				case 'Percival':
					if (merlin > -1) {
						knowledge[merlin] = 'Merlin?';
					}
					if (morgana > -1) {
						knowledge[morgana] = 'Merlin?';
					}
					break;
				case 'Merlin':
					knowledge = array.map((r) => (seemResToMerlin.includes(r) ? 'Resistance?' : 'Spy?'));
					break;
				case 'Spy':
				case 'Assassin':
				case 'Morgana':
				case 'Mordred':
					knowledge = array.map((r) => (seemResToSpy.includes(r) ? 'Resistance?' : 'Spy?'));
					break;
			}

			knowledge[index] = role;

			privateKnowledge[username] = knowledge;
		});

		this.set('privateKnowledge', privateKnowledge);

		return true;
	}

	async newRound() {
		const ended = this.get('ended');

		if (ended) return false;

		const playerList = this.get('playerList');
		const { length: players } = playerList;

		const hammerDistance = this.get('hammerDistance');
		let hammer = this.get('hammer');
		let leader = this.get('leader');

		const round = this.get('round');

		leader = (leader + 1) % players;
		if (round === 0) hammer = (leader + hammerDistance) % players;

		this.addLeader(leader);
		this.addPicks([]);
		this.addVotes([]);

		const picks = [];
		const votesMission = [];

		this.set('stage', 'PICKING');
		this.set('leader', leader);
		this.set('hammer', hammer);
		this.set('picks', picks);
		this.set('votesMission', votesMission);

		const chat = this.get('chat');
		await chat.fetch();
		chat.onPick({ leader: playerList[leader] });

		this.save({}, { useMasterKey: true });

		return true;
	}

	async pickTeam(data) {
		const { username, picks } = data;

		const host = this.get('host');
		if (username !== host) return false;

		const playerList = this.get('playerList');
		const { length: players } = playerList;
		const { length } = picks;

		const stage = this.get('stage');
		const mission = this.get('mission');
		const round = this.get('round');

		if (stage !== 'PICKING' || length !== playerMatrix[players][mission]) return false;

		const votesRound = new Array(players).fill(-1);
		const pickNames = playerList.filter((p, i) => picks.includes(i));

		this.addPicks(picks);

		this.set('stage', 'VOTING');
		this.set('picks', picks);
		this.set('picksYetToVote', picks);
		this.set('pickNames', pickNames);
		this.set('votesRound', votesRound);

		const chat = this.get('chat');
		await chat.fetch();
		chat.afterPick({ mission: mission + 1, round: round + 1, picks: pickNames });

		this.save({}, { useMasterKey: true });

		return true;
	}

	async voteForMission(data) {
		const { username, vote } = data;

		const stage = this.get('stage');
		if (stage !== 'VOTING') return false;

		const index = this.get('playerList').indexOf(username);
		const votesRound = this.get('votesRound');

		if (votesRound[index] === -1) {
			votesRound[index] = vote;

			this.set('votesRound', votesRound);
		} else {
			return false;
		}

		if (!votesRound.includes(-1)) {
			const outcome = this.countVotes(votesRound);

			if (outcome) {
				const pickNames = this.get('pickNames');

				this.set('stage', 'MISSION');

				const chat = this.get('chat');
				await chat.fetch();

				chat.afterPassing({ picks: pickNames });
			} else {
				this.newRound();
				return true;
			}
		}

		this.save({}, { useMasterKey: true });

		return true;
	}

	async countVotes(votesRound) {
		this.addVotes(votesRound);

		const { length: players } = this.get('playerList');

		const chat = this.get('chat');
		await chat.fetch();

		const yes = votesRound.reduce((y, v) => (v ? y + 1 : y), 0);

		const hammerDistance = this.get('hammerDistance');
		const mission = this.get('mission');
		const round = this.get('round');

		if (yes * 2 > players) {
			chat.afterVote({ mission: mission + 1, round: round + 1, passes: true });
			return true;
		}

		await chat.afterVote({ mission: mission + 1, round: round + 1, passes: false });

		if (round === hammerDistance) {
			this.gameEnd(3);
		}

		this.increment('round', 1);

		return false;
	}

	async voteForSuccess(data) {
		const { username, vote } = data;

		const stage = this.get('stage');
		if (stage !== 'MISSION') return false;

		const index = this.get('playerList').indexOf(username);
		const picksYetToVote = this.get('picksYetToVote');
		const votesMission = this.get('votesMission');

		if (picksYetToVote.includes(index)) {
			votesMission.push(vote);

			const i = picksYetToVote.indexOf(index);
			picksYetToVote.splice(i, 1);

			this.set('votesMission', votesMission);
			this.set('picksYetToVote', picksYetToVote);
		} else {
			return false;
		}

		if (!picksYetToVote.length) {
			const outcome = this.didMissionPass();
			this.addResult(outcome);

			const mission = this.get('mission');
			const fails = this.get('fails');

			const hasLady = this.get('hasLady');
			const ended = this.get('ended');

			const chat = this.get('chat');
			await chat.fetch();

			if (mission - fails > 2) {
				const hasAssassin = this.get('hasAssassin');

				if (hasAssassin) {
					const playerList = this.get('playerList');
					const roleList = this.get('roleList');

					const assassinIndex = roleList.indexOf('Assassin');

					chat.waitingForShot({ assassin: playerList[assassinIndex] });

					this.set('stage', 'ASSASSINATION');
				} else {
					this.gameEnd(4);
				}
			} else if (hasLady && mission > 1 && !ended) {
				const playerList = this.get('playerList');
				const lady = this.get('lady');

				chat.waitingForLady({ lady: playerList[lady] });

				this.set('stage', 'CARDING');
			} else {
				this.newRound();
				return true;
			}
		}

		this.save({}, { useMasterKey: true });

		return true;
	}

	async didMissionPass() {
		this.increment('mission', 1);
		this.set('round', 0);

		const votesMission = this.get('votesMission');
		const fails = votesMission.reduce((f, v) => (v ? f : f + 1), 0);

		const mission = this.get('mission');
		const { length: players } = this.get('playerList');

		const chat = this.get('chat');
		await chat.fetch();

		if (fails === 0) {
			chat.afterMission({ mission, fails, passes: true });
			return true;
		} else if (fails === 1 && mission === 4 && players > 6) {
			chat.afterMission({ mission, fails, passes: true });
			return true;
		}

		await chat.afterMission({ mission, fails, passes: false });

		const totalFails = this.get('fails');

		if (totalFails === 2) {
			this.gameEnd(2);
		}

		this.increment('fails', 1);
		return false;
	}

	async ladyOfTheLake(data) {
		const { username, target } = data;

		const stage = this.get('stage');
		if (stage !== 'CARDING') return false;

		const players = this.get('playerList');
		const roles = this.get('roleList');

		const index = players.indexOf(username);
		const lady = this.get('lady');
		const ladyHolders = this.get('ladyHolders');

		if (ladyHolders.includes(target) || index !== lady || index === target) return false;

		ladyHolders.push(index);

		const privateKnowledge = this.get('privateKnowledge')[username];
		const chat = this.get('chat');
		await chat.fetch();

		if (['Mordred', 'Spy', 'Morgana', 'Oberon', 'Assassin'].includes(roles[target])) {
			privateKnowledge[target] = privateKnowledge[target] === 'Merlin?' ? 'Morgana' : 'Spy';
			chat.afterCard({ username, target: players[target], spy: true });
		} else {
			privateKnowledge[target] = privateKnowledge[target] === 'Merlin?' ? 'Merlin' : 'Resistance';
			chat.afterCard({ username, target: players[target], spy: true });
		}

		this.set('lady', target);
		this.set('ladyHolders', ladyHolders);
		this.newRound();

		return true;
	}

	async shootPlayer(data) {
		const { username, shot } = data;

		const stage = this.get('stage');
		if (stage !== 'ASSASSINATION') return false;

		const players = this.get('playerList');
		const roles = this.get('roleList');

		const index = players.indexOf(username);

		if (roles[index] !== 'Assassin') return false;

		const killed = roles[shot];

		if (['Mordred', 'Spy', 'Morgana', 'Assassin'].includes(killed)) {
			return false;
		}

		const chat = this.get('chat');
		await chat.fetch();

		chat.afterShot({ target: players[shot] });

		this.set('assassination', shot);
		this.gameEnd(killed === 'Merlin' ? 0 : 1);

		this.save({}, { useMasterKey: true });

		return true;
	}

	async gameEnd(ending) {
		// 0: "Merlin was shot! The Spies Win"
		// 1: "Merlin was not shot! The Resistance wins"
		// 2: "Three missions have failed! The Spies Win"
		// 3: "The hammer was rejected! The Spies Win"
		// 4: "Three missions have succeeded! The Resistance Wins"

		const environment = require('./environment').getGlobal();
		const generalChat = environment.get('chat');
		await generalChat.fetch();

		const code = this.get('code');
		const chat = this.get('chat');
		const players = this.get('playerList');
		const roles = this.get('roleList');
		await chat.fetch();

		this.set('ended', true);
		this.set('cause', ending);
		this.set('stage', 'NONE');
		this.set('publicKnowledge', roles);

		const winner = [1, 4].includes(ending) ? 1 : 0;

		this.set('winner', winner);

		generalChat.roomFinished({ code: this.roomName, winner });
		chat.onEnd({ ending, winner });

		const userQ = new Parse.Query('_User');
		userQ.containedIn('username', players);

		userQ
			.find({
				useMasterKey: true,
			})
			.then((userList) => {
				userList.forEach((u, i) => u.addGameToProfile({ code, role: roles[i].toLowerCase(), winner, cause: ending }));
			})
			.catch((err) => console.log(err));
	}

	addPicks(data) {
		const mission = this.get('mission');
		const round = this.get('round');

		const missionPicks = this.get('missionPicks');

		missionPicks[mission][round] = data;

		this.set('missionPicks', missionPicks);
	}

	addVotes(data) {
		const mission = this.get('mission');
		const round = this.get('round');

		const missionVotes = this.get('missionVotes');

		missionVotes[mission][round] = data;

		this.set('missionVotes', missionVotes);
	}

	addLeader(data) {
		const mission = this.get('mission');

		const missionLeader = this.get('missionLeader');

		missionLeader[mission].push(data);

		this.set('missionLeader', missionLeader);
	}

	addResult(data) {
		const missionResults = this.get('missionResults');

		missionResults.push(data);

		this.set('missionResults', missionResults);
	}

	toRoomList() {
		// Define state of game
		const started = this.get('started');
		const frozen = this.get('frozen');
		const ended = this.get('ended');
		let state = 0;

		if (!started) {
			state = 0;
		} else if (!frozen) {
			if (!ended) {
				state = 1;
			} else {
				state = 2;
			}
		} else {
			if (!ended) {
				state = 3;
			} else {
				state = 4;
			}
		}

		// Define players and spectators
		const players = this.get('playerList');
		let spectators = this.get('spectatorList');
		spectators = Math.max(Object.keys(spectators).length - players.length, 0);

		// Define client
		const client = {
			state,
			spectators,
			players,
		};

		const parameters = ['code', 'host', 'mode', 'missionResults'];

		for (const x in parameters) {
			if (parameters.includes(x)) {
				client[x] = this.get(x);
			}
		}

		return client;
	}

	toClient() {
		const client = {};

		const parameters = [
			'code',
			'host',
			'playerList',
			'playerMax',
			'spectatorList',
			'kickedPlayers',
			'roleList',
			'roleSettings',
			'hasAssassin',
			'hasLady',
			'publicKnowledge',
			'privateKnowledge',
			'started',
			'ended',
			'frozen',
			'stage',
			'cause',
			'winner',
			'picks',
			'picksYetToVote',
			'pickNames',
			'votesRound',
			'votesMission',
			'leader',
			'lady',
			'hammer',
			'hammerDistance',
			'assassination',
			'mission',
			'round',
			'fails',
			'missionResults',
			'missionPicks',
			'missionVotes',
			'missionLeader',
			'ladyHolders',
		];

		for (const x in parameters) {
			const y = parameters[x];

			client[y] = this.get(y);
		}

		return client;
	}
}

Parse.Object.registerSubclass('Game', Game);

module.exports = Game;
