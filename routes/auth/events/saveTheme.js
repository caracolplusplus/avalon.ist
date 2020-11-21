function saveTheme(io, socket) {
	const { user } = socket;

	socket.on('saveTheme', async (style) => {
		await user.fetch();

		user.setTheme(style);
	});
}

module.exports = saveTheme;
