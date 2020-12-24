function saveTheme(io, socket) {
	const { user } = socket;

	socket.on('saveTheme', async (style) => {
		await user.fetch({ useMasterKey: true });

		user.setTheme(style);
	});
}

module.exports = saveTheme;
