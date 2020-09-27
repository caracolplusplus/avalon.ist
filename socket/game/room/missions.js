class Missions {
    constructor() {
        // Mission Results
        this.missionResults = [];
        // Mission Picks
        this.missionPicks = [[], [], [], [], []];
        // Mission Votes
        this.missionVotes = [[], [], [], [], []];
        // Leaders
        this.missionLeader = [[], [], [], [], []];
        // Card Holders
        this.cardHolders = [];
    }

    // Methods for storing Missions
    addPicks(mission, round, picks) {
        this.missionPicks[mission][round] = picks;
    }
    addVotes(mission, round, votes) {
        this.missionVotes[mission][round] = votes;
    }
    addLeader(mission, leader) {
        this.missionLeader[mission].push(leader);
    }
}

module.exports = Missions;
