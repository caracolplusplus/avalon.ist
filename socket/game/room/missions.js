class Missions {
    constructor(roomName) {
        this.roomName = roomName;
        // Mission Results
        this.missionResults = [];
        // Mission Picks
        this.m11picks = [];
        this.m12picks = [];
        this.m13picks = [];
        this.m14picks = [];
        this.m15picks = [];
        this.m21picks = [];
        this.m22picks = [];
        this.m23picks = [];
        this.m24picks = [];
        this.m25picks = [];
        this.m31picks = [];
        this.m32picks = [];
        this.m33picks = [];
        this.m34picks = [];
        this.m35picks = [];
        this.m41picks = [];
        this.m42picks = [];
        this.m43picks = [];
        this.m44picks = [];
        this.m45picks = [];
        this.m51picks = [];
        this.m52picks = [];
        this.m53picks = [];
        this.m54picks = [];
        this.m55picks = [];
        // Mission Votes
        this.m11votes = [];
        this.m12votes = [];
        this.m13votes = [];
        this.m14votes = [];
        this.m15votes = [];
        this.m21votes = [];
        this.m22votes = [];
        this.m23votes = [];
        this.m24votes = [];
        this.m25votes = [];
        this.m31votes = [];
        this.m32votes = [];
        this.m33votes = [];
        this.m34votes = [];
        this.m35votes = [];
        this.m41votes = [];
        this.m42votes = [];
        this.m43votes = [];
        this.m44votes = [];
        this.m45votes = [];
        this.m51votes = [];
        this.m52votes = [];
        this.m53votes = [];
        this.m54votes = [];
        this.m55votes = [];
        // Leaders
        this.m1leader = [];
        this.m2leader = [];
        this.m3leader = [];
        this.m4leader = [];
        this.m5leader = [];
        // Card Holders
        this.cardHolders = [];
    }

    // Methods for storing Missions
    addPicks(mission, round, picks) {
        this["m" + mission + round + "picks"] = picks;
    }
    addVotes(mission, round, votes) {
        this["m" + mission + round + "votes"] = votes;
    }
    addLeader(mission, leader) {
        this["m" + mission + "leader"].push(leader);
    }
}

module.exports = Missions;
