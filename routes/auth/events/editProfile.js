function editProfile(io, socket) {
	const { user } = socket;

	socket.on('editProfile', async (data) => {
		await user.fetch();

		await user.setProfile(data);

		socket.emit('saveProfile', user.toProfilePage());
	});
}

module.exports = editProfile;
