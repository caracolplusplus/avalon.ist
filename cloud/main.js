Parse.Cloud.define("setUsersAcls", async (request) => {
	let currentUser = request.user;
	currentUser.setACL(new Parse.ACL(currentUser));
	await currentUser.save(null, { useMasterKey: true });

	return "Saved ACL for " + currentUser.get("username");
});
