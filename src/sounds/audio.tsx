/* global Audio */

const soundboard: {
  [x: string]: any;
} = {
  notification: new Audio('http://127.0.0.1:1337/audio/notification.ogg'),
  slapped: new Audio('http://127.0.0.1:1337/audio/slap.ogg'),
  licked: new Audio('http://127.0.0.1:1337/audio/lick.ogg'),
  rejected: new Audio('http://127.0.0.1:1337/audio/rejected.ogg'),
};

export default soundboard;
