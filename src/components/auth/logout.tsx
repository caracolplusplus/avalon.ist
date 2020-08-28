import Parse from "../../parse/parse";
import store from "../../redux/store";
import { setOnline } from "../../redux/actions";

export async function logout() {
	Parse.User.logOut().then(
		() => {
			store.dispatch(setOnline(false));
		},
		(error) => {
			console.log("error", error);
		}
	);
}