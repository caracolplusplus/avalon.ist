function Player() {
	// User
	this.user = id;

	// Personality
	this.avatarClassic = {
		spy: 'https://i.ibb.co/cNkZrBK/base-spy-c.png',
		res: 'https://i.ibb.co/Xzpqy65/base-res-c.png',
	};
	this.avatarGummy = {
		spy: 'https://i.ibb.co/sJcthnM/base-spy.png',
		res: 'https://i.ibb.co/M8RXC95/base-res.png',
	};
	this.bio = 'A very mysterious person.';
	this.nationality = 'United Nations';
	
	// Game
	this.games = [0, 0];
	this.gameStats = {
		merlin: [0, 0],
		percival: [0, 0],
		resistance: [0, 0],
		assassin: [0, 0],
		morgana: [0, 0],
		oberon: [0, 0],
		mordred: [0, 0],
		spy: [0, 0],
	};
	this.gameHistory = [];
	this.gameShots = [0, 0];
	this.gameRating = 1500;
	
	// Customizing
	this.playArea = 1;
	this.playTabs = 2;
	this.playFontSize = 12;
	this.avatarSize = 75;
	this.avatarStyle = true;
	this.themeLight = false;
	this.coloredNames = true;
	
	// Roles
	this.isAdmin = false;
	this.isMod = false;
	this.isContrib = false;
	
	// Moderation
	this.isBanned = false;
	this.suspensionDate = 0;
	this.ips = [];
	
	// For Slaps and shit
	this.dontBotherMeUntilThisTime = Date.now();
}

module.exports = Player;
