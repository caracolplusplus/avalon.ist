/* global Audio */

const soundboard: {
  [x: string]: any;
} = {
  notification: new Audio('audio/notification.ogg'),
  slapped: new Audio('audio/slap.ogg'),
  licked: new Audio('audio/lick.ogg'),
  rejected: new Audio('audio/rejected.ogg'),
};

export default soundboard;
