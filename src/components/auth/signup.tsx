import Parse from '../../parse/parse';

export async function signup(email: string, password: string, username: string, onerror: (...args: any[]) => any) {
	var user = new Parse.User();
	user.set('email', email);
	user.set('username', username);
	user.set('password', password);

	try {
		await Parse.Cloud.run('beforeSignUp');
		await user.signUp();
		window.location.reload(true);
	} catch (error) {
		onerror(error.message);
	}
}
