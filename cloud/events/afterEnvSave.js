const afterEnvSave = async (request) => {
	const Environment = require('../../routes/constructors/environment');

	const { object: env } = request;

	Environment.setGlobal(env);

	if ('context' in request) {
		const { context } = request;

		if ('playerList' in context) {
			const { playerList } = context;

			if (!playerList) return true;

			const { io } = require('../../routes/init');

			io.emit('playerListResponse', env.get('playerList'));
		}

		if ('roomList' in context) {
			const { roomList } = context;

			if (!roomList) return true;

			const { io } = require('../../routes/init');

			io.emit('roomListResponse', env.get('roomList'));
		}

		if ('kick' in context) {
			const { kick, ips } = context;

			if (!kick) return true;

			const { io } = require('../../routes/init');

			const qMap = ips.map((i) => {
				// eslint-disable-next-line no-undef
				const userQ = new Parse.Query('_User');
				userQ.equalTo('addressList', i);

				return userQ;
			});

			const kickUser = (u) => {
				const username = u.get('username');

				io.to(username).emit('reloadPage');
			};

			// eslint-disable-next-line no-undef
			const mainQuery = Parse.Query.or(...qMap);

			mainQuery
				.find({ useMasterKey: true })
				.then((userList) => {
					userList.forEach(kickUser);
				})
				.catch((e) => console.log(e));
		}
	}

	return true;
};

module.exports = afterEnvSave;
