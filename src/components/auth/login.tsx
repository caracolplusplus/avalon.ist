import Parse from "../../parse/parse";
import socket from "../../socket-io/socket-io";

export async function login(
	username: string,
	password: string,
	onerror: (...args: any[]) => any
) {
	try {
		await Parse.User.logIn(username, password);
		Parse.Cloud.run("setUsersAcls", {});
		socket.emit("authStateChange");
	} catch (error) {
		onerror(error.message);
	}
}
