class PatriciaTree {
	constructor(initial) {
		this.tree = initial;
	}

	read(message, learn) {
		if (message.length === 0) return;

		this.tree = learn ? this.learnMessage(message, this.tree) : this.forgetMessage(message, this.tree);
	}

	learnMessage(message, tree) {
		const firstChar = message[0];

		if (!tree[firstChar]) {
			tree[firstChar] = { value: firstChar, count: 1, follows: {} };
		} else {
			tree[firstChar].count++;
		}

		const firstCharPopped = message.substring(1);

		if (firstCharPopped) {
			tree[firstChar].follows = this.learnMessage(firstCharPopped, tree[firstChar].follows);
		}

		return tree;
	}

	forgetMessage(message, tree) {
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
			tree[firstChar].follows = this.forgetMessage(firstCharPopped, tree[firstChar].follows);
		}

		return tree;
	}

	test(message) {
		return this.findMessage(message, this.tree);
	}

	findMessage(message, tree) {
		if (message.length == 0) return false;

		const firstChar = message[0];

		if (!tree[firstChar]) {
			return false;
		} else {
			const firstCharPopped = message.substring(1);

			if (firstCharPopped) {
				return this.findMessage(firstCharPopped, tree[firstChar].follows);
			} else {
				return true;
			}
		}
	}
}

module.exports = PatriciaTree;