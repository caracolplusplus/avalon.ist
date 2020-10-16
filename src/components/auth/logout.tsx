import Parse from '../../parse/parse';

export async function logout() {
	Parse.User.logOut().then(
		() => {
			window.location.reload(true);
		},
		(error) => {
			console.log('error', error);
		}
	);
}
