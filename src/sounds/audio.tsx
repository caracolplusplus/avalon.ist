/* eslint-disable no-undef */

const origin = window.location.hostname;

const soundboard: {
  [x: string]: any;
} = {
  notification: new Audio(`http://${origin}:1337/audio/notification.ogg`),
  slapped: new Audio(`http://${origin}:1337/audio/slapped.ogg`),
  licked: new Audio(`http://${origin}:1337/audio/lick.ogg`),
  rejected: new Audio(`http://${origin}:1337/audio/rejected.ogg`),
};

export default soundboard;
