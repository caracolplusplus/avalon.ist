/* global Set */
import Parse from '../../parse/parse';

interface helpPage {
  [x: number]: string[];
}

const messageTypes = {
  HELP: 'help',
  COMMAND: 'command',
  CLIENT: 'client',
  DIRECT: 'direct',
  SERVER: 'server',
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  BROADCAST: 'broadcast',
  QUOTE: 'quote',
};

const helpPages: helpPage = {
  1: [
    'General',
    '/help {page?} - Shows the full list of commands. Enter a number to go to a specific page.',
    '/roll {sides?} - Rolls a die. Enter a number to change the number of sides.',
    '/flip - Flips a coin.',
    '/clear - Clears the chat.',
  ],
  2: [
    'Buzzes',
    `/dm {player} {message} - Sends a private message to a player. 
    The message is only sent if one of the players in the conversation is part of the moderation team.`,
    '/lick {player} - Show your love to someone by licking them!',
    '/slap {player} - If you prefer something more aggressive, try slapping them!',
    '/buzz {player} - However, if you just want to call their attention, try buzzing them!',
  ],
  3: [
    'Moderation Actions',
    "/ss {player} {hours?} - Enacts a temporary suspension on the given player's account.",
    "/unss {player} - Lifts a temporary suspension from the given player's account.",
    "/ban {player} - Enacts a permanent ban on the given player's account.",
    "/unban {player} - Lifts a permanent ban from the given player's account.",
    "/banip {player} - Enacts a permanent ban on the given player's account and its correspondent IPs.",
    '/unbanip {ip} - Lifts a permanent ban on the given IP address.',
    '/logs - Retrieves moderation logs and prints them in browser console.',
    '/maintenance - Toggles the maintenance feature of the site. It will disconnect everyone if its currently on maintenance.',
    '/lockdown - Toggles the lockdown feature of the site. It will prevent anyone from creating verified accounts. The new accounts made in this period require verification from the moderators.',
    '/passwordreset {email} - Sends a mail to the specified email, allowing for a password reset.',
  ],
  4: [
    'Game Moderation Actions',
    '/pause {room code} - Pauses the specified game and no actions can be performed while the game is paused.',
    '/unpause {room code} - Unpauses the specified game and actions can be performed again.',
    '/end {room code} {outcome?} - Ends the specified game with the specified outcome. Entering 1 will make Resistance win, entering 0 will make Spy win. Not entering any outcome will void the game.',
    '/close {room code} - Closes the specified game and kicks every player in the room.',
    '/learnroles {room code} - Shows the roles of all the players in the specified game.',
  ],
  5: [
    'Editors',
    '/announce - Opens an announcement editing menu. Submissions can only be done by moderators.',
    '/avatarset - Opens an avatar editing menu. Submissions can only be done by moderators.',
    '/discordset {url} - Sets the URL for the Reports Webhook on Discord.',
  ],
};

interface MessageBuilderType {
  username: string;
}

let messagesSent: number = 0;

class MessageBuilder implements MessageBuilderType {
  username = '';

  addMessage = (data: any) => {
    // This function must be updated in server as well

    const { SERVER } = messageTypes;

    const timestamp = Date.now();
    const objectId = messagesSent.toString();

    messagesSent++;

    const message = {
      public: typeof data.public === 'boolean' ? data.public : true,
      type: data.type || SERVER,
      from: data.from || this.username,
      to: data.to || [],
      content: data.content || 'Hello World!',
      timestamp: data.timestamp || timestamp,
      objectId,
    };

    return message;
  };

  zalgoTest = (data: any) => {
    const zalgo = /%CC%/g;

    return zalgo.test(encodeURIComponent(data));
  };

  defaultMessage = (username: string) => {
    const { COMMAND } = messageTypes;

    return [
      this.addMessage({
        type: COMMAND,
        public: false,
        content: 'Invalid Command. Type /help {page} for a list of commands.',
        to: [username],
      }),
    ];
  };

  commandResponseMessage = (content: any) => {
    if (!content) return [];

    const { COMMAND } = messageTypes;
    const { username } = this;

    return [
      this.addMessage({
        type: COMMAND,
        public: false,
        content,
        to: [username],
      }),
    ];
  };

  sendServerMessage = (data: any) => {
    const { ch, content } = data;
    const { SERVER, POSITIVE, NEGATIVE } = messageTypes;
    const type = [SERVER, POSITIVE, NEGATIVE][ch];

    const output = [
      this.addMessage({
        type,
        content,
      }),
    ];

    // socket.emit(this.emission, output);

    return output;
  };

  waitingForServerResponse = (username: string) => {
    const { COMMAND } = messageTypes;

    return [
      this.addMessage({
        type: COMMAND,
        public: false,
        content: 'Waiting for server response...',
        to: [username],
      }),
    ];
  };

  sendMessage = (data: any) => {
    const { zalgoTest, addMessage } = this;
    const { COMMAND, CLIENT } = messageTypes;
    const { username, content, code } = data;

    const hasZalgo = zalgoTest(content);

    const message = addMessage(
      hasZalgo
        ? {
            type: COMMAND,
            public: false,
            content:
              'You are trying to post a message with invalid characters. Please, refrain from doing it.',
            to: [username],
          }
        : {
            type: CLIENT,
            from: username,
            content,
          }
    );

    const output = [message];

    if (!hasZalgo)
      Parse.Cloud.run('chatCommands', { call: 'messageTo', code, messages: output });

    return output;
  };

  sendDirectMessage = (data: any) => {
    const { zalgoTest, addMessage } = this;
    const { COMMAND, DIRECT } = messageTypes;
    const { username, content, split, code } = data;

    if (!split[1])
      return [
        addMessage({
          type: COMMAND,
          public: false,
          content: 'The message you are trying to send has no target.',
          to: [username],
        }),
      ];

    if (!split[2])
      return [
        addMessage({
          type: COMMAND,
          public: false,
          content: 'You are trying to send an empty DM. Please refrain from doing it.',
          to: [username],
        }),
      ];

    let _content = content.replace(split[1], '');
    _content = _content.slice(_content.indexOf(split[2]));

    const hasZalgo = zalgoTest(content);

    const message = addMessage(
      hasZalgo
        ? {
            type: COMMAND,
            public: false,
            content:
              'You are trying to post a message with invalid characters. Please, refrain from doing it.',
            to: [username],
          }
        : {
            type: DIRECT,
            public: false,
            from: username,
            to: [split[1]],
            content: _content,
          }
    );

    const output = [message];

    if (!hasZalgo)
      Parse.Cloud.run('chatCommands', { call: 'messageTo', code, messages: output });

    return output;
  };

  rollDie(data: any) {
    const { username, split } = data;

    let die: any = Math.min(Math.max(parseInt(split[1]), 3), 10000);

    die = isNaN(die) ? 100 : die;
    const roll = Math.floor(Math.random() * die) + 1;

    return this.sendServerMessage({
      content: `${username} has rolled ${roll} out of ${die}!`,
      ch: 0,
    });
  }

  flipCoin(data: any) {
    const { username } = data;
    const result = Math.random() > 0.5;
    const coin = result ? 'heads' : 'tails';

    return this.sendServerMessage({
      content: `${username} flipped a coin and landed on ${coin}!`,
      ch: result ? 1 : 2,
    });
  }

  findQuote = (data: any) => {
    const output: any[] = [];
    const { addMessage } = this;
    const { CLIENT, QUOTE, COMMAND } = messageTypes;
    const { username, content, messages, code } = data;

    let quotesExist = false;

    const quoteTrimmer = (x: string) => x.trim();
    const quoteRegex = /[0-9]{2}:[0-9]{2} /;

    let quotes = content.split(quoteRegex).map(quoteTrimmer).slice(0, 5);

    quotes = new Set(quotes);

    messages.forEach((message: any) => {
      const { type, public: _public, from, content: _content, timestamp } = message;

      if (_public) {
        const referent = type === CLIENT ? `${from}:${_content}` : _content;

        if (!quotes.has(referent)) return false;

        quotes.delete(referent);

        if (!quotesExist) {
          output.push(
            addMessage({
              content: `${username} quotes:`,
            })
          );

          quotesExist = true;
        }

        const quote = { from, content: _content, timestamp, type: QUOTE };

        output.push(addMessage(quote));
      }
    });

    if (!quotesExist) {
      output.push(
        addMessage({
          type: COMMAND,
          public: false,
          content: `Quote received doesn't exist`,
          to: [username],
        })
      );
    } else {
      Parse.Cloud.run('chatCommands', { call: 'messageTo', code, messages: output });
    }

    return output;
  };

  getCommandHelp = (data: any) => {
    const { COMMAND, HELP } = messageTypes;
    const { addMessage } = this;
    const { username, page } = data;

    const pageMax = 5;

    let pageInt = parseInt(page);
    pageInt = isNaN(pageInt) || pageInt < 1 || pageInt > pageMax ? 1 : pageInt;

    const help = helpPages[pageInt];

    return help.map((content, i) =>
      addMessage({
        type: i ? COMMAND : HELP,
        from: `Help Page (${pageInt}/5)`,
        content,
        public: false,
        to: [username],
      })
    );
  };

  /* suspendPlayer = (data) => {
    const { COMMAND } = messageTypes;
    const { username, target, hours, comment } = data;

    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', target);

    userQ
      .first({ useMasterKey: true })
      .then((u) => {
        if (u) {
          const environment = require('./environment').getGlobal();
          const h = u.setSuspension({ hours });

          this.addMessage({
            type: COMMAND,
            public: false,
            content: `${target} has been suspended for ${h} hour${h === 1 ? '' : 's'}.`,
            to: [username],
          });

          environment.addModerationLog({
            duration: h,
            action: 'SUSPENSION',
            from: username,
            to: target,
            comment,
          });

          this.save({}, { useMasterKey: true });
        }
      })
      .catch((e) => console.log(e));
  }

  revokeSuspension(data) {
    const { COMMAND } = messageTypes;
    const { username, target, comment } = data;

    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', target);

    userQ
      .first({ useMasterKey: true })
      .then((u) => {
        if (u) {
          const environment = require('./environment').getGlobal();
          u.revokeSuspension();

          this.addMessage({
            type: COMMAND,
            public: false,
            content: `${target} has been unsuspended.`,
            to: [username],
          });

          environment.addModerationLog({
            action: 'REVOKE SUSPENSION',
            from: username,
            to: target,
            comment,
          });

          this.save({}, { useMasterKey: true });
        }
      })
      .catch((e) => console.log(e));
  }

  banPlayer(data) {
    const { COMMAND } = messageTypes;
    const { username, target, comment } = data;

    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', target);

    userQ
      .first({ useMasterKey: true })
      .then((u) => {
        if (u) {
          const environment = require('./environment').getGlobal();
          u.toggleBan(true);

          this.addMessage({
            type: COMMAND,
            public: false,
            content: `${target} has been banned.`,
            to: [username],
          });

          environment.addModerationLog({
            action: 'BAN',
            from: username,
            to: target,
            comment,
          });

          this.save({}, { useMasterKey: true });
        }
      })
      .catch((e) => console.log(e));
  }

  revokeBan(data) {
    const { COMMAND } = messageTypes;
    const { username, target, comment } = data;

    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', target);

    userQ
      .first({ useMasterKey: true })
      .then((u) => {
        if (u) {
          const environment = require('./environment').getGlobal();
          u.toggleBan(false);

          this.addMessage({
            type: COMMAND,
            public: false,
            content: `${target} has been unbanned.`,
            to: [username],
          });

          environment.addModerationLog({
            action: 'REVOKE BAN',
            from: username,
            to: target,
            comment,
          });

          this.save({}, { useMasterKey: true });
        }
      })
      .catch((e) => console.log(e));
  }

  banPlayerIP(data) {
    const { COMMAND } = messageTypes;
    const { username, target, comment } = data;

    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', target);

    userQ
      .first({ useMasterKey: true })
      .then((u) => {
        if (u) {
          const environment = require('./environment').getGlobal();
          const ips = u.get('addressList');
          u.toggleBan(false);

          this.addMessage({
            type: COMMAND,
            public: false,
            content: `${target} has been banned and all their IP adresses are blacklisted.`,
            to: [username],
          });

          environment.toggleIps({ ips, add: true });

          environment.addModerationLog({
            action: 'BAN IP',
            from: username,
            to: target,
            comment,
            info: {
              ips,
            },
          });

          this.save({}, { useMasterKey: true });
        }
      })
      .catch((e) => console.log(e));
  }

  revokeIPBan(data) {
    const { COMMAND } = messageTypes;
    const { username, ips, comment } = data;

    const environment = require('./environment').getGlobal();

    this.addMessage({
      type: COMMAND,
      public: false,
      content: `Addresses ${ips.join(', ')} has been whitelisted.`,
      to: [username],
    });

    environment.toggleIps({ ips, add: false });

    environment.addModerationLog({
      action: 'REVOKE IP BAN',
      from: username,
      comment,
      info: {
        ips,
      },
    });

    this.save({}, { useMasterKey: true });

    return true;
  }

  getLogs(data) {
    const { COMMAND } = messageTypes;
    const { username } = data;
    const environment = require('./environment').getGlobal();

    this.addMessage({
      type: COMMAND,
      public: false,
      content: `Moderation Logs Received. Open Browser Console.`,
      to: [username],
    });

    this.save({}, { useMasterKey: true });

    return environment.get('moderationLogs');
  }

  toggleMaintenance(data) {
    const { COMMAND } = messageTypes;
    const { username } = data;
    const environment = require('./environment').getGlobal();

    this.addMessage({
      type: COMMAND,
      public: false,
      content: `Maintenance mode was toggled.`,
      to: [username],
    });

    environment.toggleMaintenance();

    this.save({}, { useMasterKey: true });

    return true;
  } */
}

export default MessageBuilder;
