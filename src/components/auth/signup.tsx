import Parse from "../../parse/parse";
import store from "../../redux/store";
import { setOnline } from "../../redux/actions";

export async function signup(
	email: string,
	password: string,
	username: string,
	onerror: (...args: any[]) => any
) {
	var user = new Parse.User();
	user.set("email", email);
	user.set("username", username);
	user.set("password", password);

	try {
		await user.signUp();
		Parse.Cloud.run("setUsersAcls", {});
		store.dispatch(setOnline(true));
	} catch (error) {
		onerror(error.message);
	}
}
