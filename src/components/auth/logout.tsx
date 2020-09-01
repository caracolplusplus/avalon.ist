import Parse from '../../parse/parse';
import socket from '../../socket-io/socket-io';

export async function logout() {
	Parse.User.logOut().then(
		() => {
			socket.emit('authStateChange');
		},
		(error) => {
			console.log('error', error);
		}
	);
}
