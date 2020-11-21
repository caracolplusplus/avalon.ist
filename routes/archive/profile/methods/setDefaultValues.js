function setDefaultValues({ user }) {
    for (const x in this) {
      if (!user.has(x)) user.set(x, this[x]);
    }

    return user;
}

module.exports = setDefaultValues;