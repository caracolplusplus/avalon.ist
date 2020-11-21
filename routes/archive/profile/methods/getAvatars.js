async function getAvatars({ user }) {
	await user.fetch();

	return { avatarClassic: user.get('avatarClassic'), avatarGummy: user.get('avatarGummy') };
}

module.exports = getAvatars;
