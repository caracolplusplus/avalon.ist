const PatriciaTree = require('./p-tree');

class EmailTree {
  constructor() {
    this.tree = new PatriciaTree({});
  }

  setTree(domains) {
    this.tree = new PatriciaTree({});

    for (const x in domains) {
      const input = domains[x];
      const output = this.domainToBinary(input);

      this.tree.read(output, true);
    }

    return this;
  }

  testEmail(input) {
    const domain = this.domainToBinary(input);

    return this.tree.test(domain);
  }

  domainToBinary(input) {
    let output = '';

    for (let i = 0; i < input.length; i++) {
      output += input[i].charCodeAt(0).toString(2);
    }

    return output;
  }
}

module.exports = new EmailTree();
