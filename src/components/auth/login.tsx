import Parse from '../../parse/parse';

export async function login(username: string, password: string, onerror: (...args: any[]) => any) {
	try {
		await Parse.User.logIn(username, password);
		window.location.reload(true);
	} catch (error) {
		onerror(error.message);
	}
}
