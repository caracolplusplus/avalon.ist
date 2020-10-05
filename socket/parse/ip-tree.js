let v4count = 0;
let v6count = 0;

const PatriciaTree = require('./p-tree');

class IpTree {
	constructor(initialIpv4, initialIpv6) {
		this.Ipv4 = new PatriciaTree(initialIpv4);
		this.Ipv6 = new PatriciaTree(initialIpv6);
	}

	setBlacklistFromArray(untrustedIps) {
		for (const x in untrustedIps) {
			const ip = untrustedIps[x];

			this.readIp(ip, true);
		}

		return this;
	}

	readIp(ip, learn) {
		const Ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
		const Ipv6Regex = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/;

		if (Ipv4Regex.test(ip)) {
			const ipBinary = this.Ipv4toBinary(ip);

			if (ipBinary) {
				this.Ipv4.read(ipBinary, learn);

				v4count++;
				return true;
			}

			return false;
		} else if (Ipv6Regex.test(ip)) {
			const ipBinary = this.Ipv6toBinary(ip);

			if (ipBinary) {
				this.Ipv6.read(ipBinary, learn);

				v6count++;
				return true;
			}

			return false;
		}

		return false;
	}

	testIp(ip) {
		const Ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
		const Ipv6Regex = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/;

		if (Ipv4Regex.test(ip)) {
			const ipBinary = this.Ipv4toBinary(ip);

			if (ipBinary) return this.Ipv4.test(ipBinary);
		} else if (Ipv6Regex.test(ip)) {
			const ipBinary = this.Ipv6toBinary(ip);

			if (ipBinary) return this.Ipv6.test(ipBinary);
		}

		return false;
	}

	Ipv4toBinary(ip) {
		const ipArr = ip.split('.');
		let ipBinary = '';

		for (const x in ipArr) {
			const n = parseInt(ipArr[x]);

			if (isNaN(n)) return undefined;

			if (n < 0 || n > 255 || n % 1 !== 0) {
				return undefined;
			}

			ipBinary += ('000000000' + n.toString(2)).substr(-8);
		}

		return ipBinary;
	}

	Ipv6toBinary(ip) {
		const ipArr = ip.split(':');
		let ipHex = '';
		let ipBinary = '';

		for (const x in ipArr) {
			const n = parseInt(ipArr[x], 16);

			if (isNaN(n)) return undefined;

			ipHex += n + '.';

			ipBinary += ('0000000000000000' + n.toString(2)).substr(-16);
		}

		return ipBinary;
	}
}

module.exports = new IpTree({}, {});
