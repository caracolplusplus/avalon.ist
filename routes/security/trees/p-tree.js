class PatriciaTree {
	constructor(initial) {
		this.tree = initial;
	}

	read(message, learn) {
		if (message.length === 0) return;

		this.tree = learn ? this.learn(message, this.tree) : this.forget(message, this.tree);
	}

	test(message) {
		return this.find(message, this.tree);
	}

	learn(message, tree) {
		const firstChar = message[0];

		if (!tree[firstChar]) {
			tree[firstChar] = { value: firstChar, count: 1, follows: {} };
		} else {
			tree[firstChar].count++;
		}

		const firstCharPopped = message.substring(1);

		if (firstCharPopped) {
			tree[firstChar].follows = this.learn(firstCharPopped, tree[firstChar].follows);
		}

		return tree;
	}

	forget(message, tree) {
		const firstChar = message[0];

		if (!tree[firstChar]) {
			return tree;
		} else {
			tree[firstChar].count--;

			if (tree[firstChar].count < 1) {
				delete tree[firstChar];

				return tree;
			}
		}

		const firstCharPopped = message.substring(1);

		if (firstCharPopped) {
			tree[firstChar].follows = this.forget(firstCharPopped, tree[firstChar].follows);
		}

		return tree;
	}

	find(message, tree) {
		if (message.length == 0) return false;

		const firstChar = message[0];

		if (!tree[firstChar]) {
			return false;
		} else {
			const firstCharPopped = message.substring(1);

			if (firstCharPopped) {
				return this.find(firstCharPopped, tree[firstChar].follows);
			} else {
				return true;
			}
		}
	}
}

module.exports = PatriciaTree;
