function toClient() {
	const client = {...this };

	delete client.ips;

	return client;
}

module.exports = toClient;