import Parse from '../../parse/parse';
import socket from '../../socket-io/socket-io';

export async function signup(email: string, password: string, username: string, onerror: (...args: any[]) => any) {
	var user = new Parse.User();
	user.set('email', email);
	user.set('username', username);
	user.set('password', password);

	try {
		await user.signUp();
		Parse.Cloud.run('setUsersAcls', {});
		socket.emit('authStateChange');
	} catch (error) {
		onerror(error.message);
	}
}
