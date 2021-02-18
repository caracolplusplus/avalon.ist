import Parse from 'parse';

export async function logout() {
  await Parse.Cloud.run('generalCommands', { call: 'leavePresence' });

  await Parse.User.logOut();

  window.location.reload(true);
}
