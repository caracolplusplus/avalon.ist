const GeneralChat = require('../../chat/general-chat');

const playerMatrix = [
  [2, 3, 2, 3, 3],
  [2, 3, 4, 3, 4],
  [2, 3, 3, 4, 4],
  [3, 4, 4, 5, 5],
  [3, 4, 4, 5, 5],
  [3, 4, 4, 5, 5],
];

class Actions {
  constructor(roomName, players, hasAssassin, hasCard, gameClass, missionClass, chatClass) {
    const leader = Math.floor(Math.random() * players);

    // Holds Game Current State
    this.roomName = roomName;
    // Mission Vote Handlers
    this.picks = [];
    this.votesRound = [];
    this.votesMission = [];
    this.voted = [];
    // Power Positions
    this.leader = leader;
    this.hammer = -1;
    this.assassination = -1;
    this.card = hasCard ? (leader + players) % players : -1;
    // Mission Count
    this.mission = 0;
    this.round = 0;
    this.turn = 0;
    this.fails = 0;
    // Data
    this.players = players;
    this.ended = false;
    this.frozen = false;
    this.cause = -1;
    this.stage = 'PICKING';
    this.winner = -1;
    // Modes
    this.hasAssassin = hasAssassin;
    this.hasCard = hasCard;
    // Other Game Components
    this.gameClass = gameClass;
    this.missionClass = missionClass;
    this.chatClass = chatClass;
  }

  deserialize(input) {
    for (const x in input) {
      Reflect.set(this, x, Reflect.get(input, x));
    }
    return this;
  }

  // Methods for games
  // This method sets a new round to start
  newRound() {
    if (this.ended) return;

    const playersInMission = playerMatrix[this.players - 5][this.mission];

    const newPicks = new Array(playersInMission).fill(-1);
    const newVotesMission = new Array(playersInMission).fill(-1);

    newPicks.fill(-1);
    newVotesMission.fill(-1);

    this.picks = newPicks;
    this.votesMission = newVotesMission;

    this.leader = (this.leader + 1) % this.players;
    if (this.round === 0) this.hammer = (this.leader + 4) % this.players;

    this.missionClass.addLeader(this.mission + 1, this.leader);

    this.stage = 'PICKING';

    this.chatClass.onPick(this.gameClass.players[this.leader]);
  }

  // Get pick names
  pickNames() {
    return this.gameClass.players
      .filter((p, i) => this.picks.includes(i))
      .toString()
      .replace(/,/g, ', ');
  }

  // These methods check pick validity
  picksHaveDuplicates(array) {
    return new Set(array).size !== array.length;
  }

  picksLengthIsWrong(array) {
    return array.length !== playerMatrix[this.players - 5][this.mission];
  }

  // This method picks a team
  pickTeam(index, picks) {
    picks = picks.map((p) => Math.round(Math.min(Math.max(p, 0), this.players - 1)));

    if (
      index !== this.leader ||
      this.stage !== 'PICKING' ||
      this.picksHaveDuplicates(picks) ||
      this.picksLengthIsWrong(picks)
    )
      return false;

    this.missionClass.addPicks(this.mission + 1, this.round + 1, picks);

    this.picks = [...picks];
    this.voted = [...picks];

    this.stage = 'VOTING';

    this.votesRound = new Array(this.players).fill(-1);

    this.chatClass.afterPick(this.mission + 1, this.round + 1, this.pickNames());

    return true;
  }

  // This method sends a vote for a mission
  voteForMission(index, vote) {
    if (this.stage !== 'VOTING') return false;

    if (this.votesRound[index] === -1 && (vote === 0 || vote === 1)) {
      this.votesRound[index] = vote;
    } else {
      return false;
    }

    if (!this.votesRound.includes(-1)) {
      let result = this.missionVoteChecker();

      if (result) {
        this.chatClass.afterPassing(this.pickNames());
        this.stage = 'MISSION';
      } else {
        this.newRound();
      }
    }

    return true;
  }

  // This method counts to see if there are enough votes to pass a mission
  missionVoteChecker() {
    this.missionClass.addVotes(this.mission + 1, this.round + 1, this.votesRound);
    let yes = 0;

    this.votesRound.forEach((v) => {
      if (v === 1) yes++;
    });

    if (yes * 2 > this.players) {
      this.chatClass.afterVote(this.mission + 1, this.round + 1, true);
      return true;
    }

    this.chatClass.afterVote(this.mission + 1, this.round + 1, false);

    if (this.round === 4) {
      this.gameEnd(3);
    }

    this.turn++;
    this.round++;
    return false;
  }

  // This method checks resistance vote validity
  voteIsInvalid(index, vote) {
    const res = ['Resistance', 'Percival'].includes(this.gameClass.roles[index]);
    return res && vote === 0;
  }

  // This method sends a vote for success in a mission
  voteForSuccess(index, vote) {
    if (this.stage !== 'MISSION') return false;

    if (
      this.voted.includes(index) &&
      this.votesMission.includes(-1) &&
      (vote === 0 || vote === 1) &&
      !this.voteIsInvalid(index, vote)
    ) {
      this.votesMission.unshift(vote);
      this.votesMission.pop();

      const i = this.voted.findIndex((p) => p === index);
      this.voted[i] = -1;
    } else {
      return false;
    }

    if (!this.votesMission.includes(-1)) {
      this.missionClass.missionResults.push(this.missionPasses());

      if (this.mission - this.fails > 2) {
        if (this.hasAssassin) {
          this.chatClass.waitingForShot(this.gameClass.players[this.gameClass.roles.indexOf('Assassin')]);
          this.stage = 'ASSASSINATION';
        } else {
          this.gameEnd(4);
        }
      } else if (this.hasCard && this.mission > 1 && !this.ended) {
        this.chatClass.waitingForCard(this.gameClass.players[this.card]);
        this.stage = 'CARDING';
      } else {
        this.newRound();
      }
    }

    return true;
  }

  // This methods counts to see if the mission picked passes
  missionPasses() {
    let fails = 0;

    this.mission++;
    this.turn++;
    this.round = 0;

    this.votesMission.forEach((v) => {
      if (v === 0) fails++;
    });

    if (fails === 0) {
      this.chatClass.afterMission(this.mission, fails, true);
      return true;
    } else if (fails === 1 && this.mission === 4 && this.players > 6) {
      this.chatClass.afterMission(this.mission, fails, true);
      return true;
    }

    this.chatClass.afterMission(this.mission, fails, false);

    if (this.fails === 2) {
      this.gameEnd(2);
    }

    this.fails++;
    return false;
  }

  // Method for identifying roles with Lady of the Lake
  cardPlayer(index, carded) {
    const players = this.gameClass.players;
    const roles = this.gameClass.roles;

    if (
      this.stage !== 'CARDING' ||
      this.missionClass.cardHolders.includes(carded) ||
      index !== this.card ||
      index === carded ||
      !roles[carded]
    )
      return false;

    this.missionClass.cardHolders.push(index);

    this.card = carded;
    this.newRound();

    if (['Mordred', 'Spy', 'Morgana', 'Oberon', 'Assassin'].includes(roles[carded])) {
      this.chatClass.afterCard(players[index], players[carded], true);
      return true;
    }

    this.chatClass.afterCard(players[index], players[carded], false);
    return true;
  }

  // This method checks to see who is shot
  // Returns true if the shot has happened, returns false if its not
  shootPlayer(index, shot) {
    const players = this.gameClass.players;
    const roles = this.gameClass.roles;

    if (this.stage !== 'ASSASSINATION' || !roles[shot] || roles[index] !== 'Assassin') return false;

    if (roles[shot] === 'Merlin') {
      this.chatClass.afterShot(players[shot]);
      this.assassination = shot;
      this.gameEnd(0);
      return true;
    } else if (['Mordred', 'Spy', 'Morgana', 'Assassin'].includes(roles[shot])) {
      return false;
    }

    this.chatClass.afterShot(players[shot]);
    this.assassination = shot;
    this.gameEnd(1);
    return true;
  }

  // Method for ending the game when a shot is made
  gameEnd(ending) {
    this.ended = true;
    this.cause = ending;
    this.stage = '';
    this.gameClass.publicKnowledge = this.gameClass.roles;

    this.winner = [1, 4].includes(ending) ? 1 : 0;

    GeneralChat.roomFinished(this.roomName, this.winner);

    this.chatClass.onEnd(this.roomName, this.cause, this.winner);

    // 0: "Merlin was shot! The Spies Win"
    // 1: "Merlin was not shot! The Resistance wins"
    // 2: "Three missions have failed! The Spies Win"
    // 3: "The hammer was rejected! The Spies Win"
    // 4: "Three missions have succeeded! The Resistance Wins"
  }
}

module.exports = Actions;
