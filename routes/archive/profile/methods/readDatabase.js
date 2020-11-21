function readDatabase({ user }) {
	const store = { ...this };

	delete store.user;
	delete store.dontBotherMeUntilThisTime;

	for (const x in store) {
		const got = user.get(x);

		if (got === undefined) continue;

		if (['avatarClassic', 'avatarGummy', 'gameStats'].includes(x)) {
			this[x] = { ...this[x], ...got };
		} else {
			this[x] = got;
		}
	}

	return this;
}

module.exports = readDatabase;
