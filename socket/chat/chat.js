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
        HIGHLIGHT 2
        POSITIVE 1
        NEUTRAL 0
        NEGATIVE -1
    Timestamp
        MILLISECONDS
} */
const AVALONIST_NAME = 'AvalonistServerMessage';

class Chat {
	constructor() {
		this.messages = [];
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
		});
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
		});
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
		});
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
		});
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
		});
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
		});
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
		});
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
			},
			{
				public: true,
				content: content2,
				author: AVALONIST_NAME,
				to: [],
				type: 1,
				character: 2,
				timestamp: Date.now(),
			}
		);
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
		});
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
		});
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
		});
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
		});
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
		});
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
		});
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
			},
			{
				public: false,
				content: content2.replace(/{result}/gi, result).replace(/{carded}/gi, carded),
				author: AVALONIST_NAME,
				to: [player],
				type: 1,
				character: isSpy ? -1 : 1,
				timestamp: Date.now(),
			}
		);
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
			},
			{
				public: true,
				content: content2,
				author: AVALONIST_NAME,
				to: [],
				type: 1,
				character: winner ? 1 : -1,
				timestamp: Date.now(),
			}
		);
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
		});
	}
}

module.exports = Chat;
