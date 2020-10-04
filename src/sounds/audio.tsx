const ping = new Audio('audio/notification.ogg')

const soundboard: {
	[x: string]: any;
} = {
	notification: ping,
	buzzed: ping,
	slapped: new Audio('audio/slap.ogg'),
	licked: new Audio('audio/lick.ogg'),
	rejected: new Audio('audio/rejected.ogg'),
};

export default soundboard;
