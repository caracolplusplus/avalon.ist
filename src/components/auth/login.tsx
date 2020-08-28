import Parse from "../../parse/parse";
import store from "../../redux/store";
import { setOnline } from "../../redux/actions";

export async function login(
	username: string,
	password: string,
	onerror: (...args: any[]) => any
) {
	try {
		await Parse.User.logIn(username, password);
		Parse.Cloud.run("setUsersAcls", {});
		store.dispatch(setOnline(true));
	} catch (error) {
		onerror(error.message);
	}
}
