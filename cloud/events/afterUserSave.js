const afterUserSave = async (request) => {
	const user = request.object;

	if ('context' in request) {
		const { context } = request;

		if ('kick' in context) {
			const { kick } = context;

			if (!kick) return true;

			const { io } = require('../../routes/init');

			const username = user.get('username');
			io.to(username).emit('reloadPage');
		}
	}

	return true;
};

module.exports = afterUserSave;
