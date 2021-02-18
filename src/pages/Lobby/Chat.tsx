// eslint-disable-next-line no-unused-vars
import React, { FormEvent, createRef } from 'react';
import Parse from 'parse';
import queryClient from '../../parse/queryClient';
// eslint-disable-next-line no-unused-vars
import { rootType } from '../../redux/reducers';
import { setMessageDelay } from '../../redux/actions';
import { connect } from 'react-redux';
import AvalonScrollbars from '../../components/utils/AvalonScrollbars';
import { ChatInput } from '../../components/utils/Input';
import MessageBuilder from './MessageBuilder';
import TooFast from './ChatTooFast';
import Soundboard from '../../sounds/audio';
import AnnouncementForm from './ChatAnnouncementForm';
import AvatarForm from './ChatAvatarForm';

import '../../styles/Lobby/Chat.scss';

const userShow = new Set(['client', 'help', 'quote', 'direct']);

// eslint-disable-next-line no-unused-vars
enum FormType {
  // eslint-disable-next-line no-unused-vars
  None = 0,
  // eslint-disable-next-line no-unused-vars
  Fast = 1,
  // eslint-disable-next-line no-unused-vars
  Announce = 2,
  // eslint-disable-next-line no-unused-vars
  Avatar = 3,
}

interface ChatSnapshot {
  public: boolean;
  content: string;
  from: string;
  to: string[];
  type: string;
  timestamp: number;
  objectId: string;
}

interface ChatSnapshotRead {
  timestamp: number;
  hour: string;
  from: string | null;
  content: string;
  id: string;
  type: string;
  public: boolean;
}

interface ChatProps {
  dispatch?: any;
  messageDelay?: any;
  code?: string;
  players: string[];
  stage?: string;
  chatHighlights: { [key: string]: string };
  username: string;
  style?: any;
}

interface ChatState {
  messages: ChatSnapshotRead[];
  playerList: string[];
  adminList: string[];
  modList: string[];
  contribList: string[];
  loaded: boolean;
  form: FormType;
  showAllMessages: boolean;
}

const mapState = (state: rootType) => {
  const { chatHighlights, username, messageDelay, style } = state;
  return { chatHighlights, username, messageDelay, style };
};

const msgBuilder = new MessageBuilder();

class Chat extends React.PureComponent<ChatProps, ChatState> {
  state: ChatState = {
    messages: [],
    playerList: [],
    adminList: [],
    modList: [],
    contribList: [],
    loaded: false,
    form: FormType.None,
    showAllMessages: false,
  };
  mounted: boolean = true;
  listSub: any = null;
  messageSub: any = null;
  sentMessages: ChatSnapshot[] = [];
  refScrollbars = createRef<AvalonScrollbars>();
  refInput = createRef<ChatInput>();

  componentDidMount = () => {
    this.startChat();
    this.playerListSubscription();
  };

  componentWillUnmount = () => {
    this.mounted = false;
    if (this.messageSub) queryClient.unsubscribe(this.messageSub);
    if (this.listSub) queryClient.unsubscribe(this.listSub);
  };

  componentDidUpdate = (prevProps: ChatProps) => {
    const { code } = this.props;
    const { code: _code } = prevProps;

    if (code !== _code) {
      if (this.messageSub) queryClient.unsubscribe(this.messageSub);
      this.startChat();
    }
  };

  toggleShowAllMessages = () => {
    this.setState({
      showAllMessages: !this.state.showAllMessages,
    });
  };

  handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    this.sendMessage();
  };

  playerListSubscription = () => {
    const listQ = new Parse.Query('Lists');

    this.listSub = queryClient.subscribe(listQ);

    this.listSub.on('open', this.playerListRequest);
    this.listSub.on('update', (lists: any) => {
      this.playerListResponse(lists.get('playerList'));
    });
  };

  playerListRequest = () => {
    Parse.Cloud.run('generalCommands', { call: 'playerListRequest' }).then(
      this.playerListResponse
    );
  };

  playerListResponse = (players: any) => {
    if (!this.mounted) {
      queryClient.unsubscribe(this.listSub);
      return;
    }

    const adminList: string[] = [];
    const modList: string[] = [];
    const contribList: string[] = [];

    const playerList: string[] = players.map((p: any) => {
      const { username } = p;

      if (p.isAdmin) adminList.push(username);
      if (p.isMod) modList.push(username);
      if (p.isContrib) contribList.push(username);

      return username;
    });

    this.setState({ playerList, adminList, modList, contribList });
  };

  startChat = () => {
    const { code, username } = this.props;

    const publicMessages = new Parse.Query('Message');
    publicMessages.equalTo('public', true);

    const myMessages = new Parse.Query('Message');
    myMessages.equalTo('from', username);

    const messagesDirectedToMe = new Parse.Query('Message');
    messagesDirectedToMe.equalTo('to', username);

    const messageQ = Parse.Query.or(publicMessages, myMessages, messagesDirectedToMe);

    if (code) {
      messageQ.equalTo('code', code);
    } else {
      messageQ.equalTo('global', true);
    }

    console.log('hai');

    this.messageSub = queryClient.subscribe(messageQ);

    this.messageSub.on('open', () => {
      Parse.Cloud.run('chatCommands', { call: 'chatRequest', code })
        .then(this.parseOldMessages)
        .then(this.loadChat)
        .catch((err) => console.log(err));
    });

    this.messageSub.on('create', (message: any) => {
      if (this.state.loaded) {
        const mNew = message.toJSON();
        const sentMessageIndex = this.sentMessages.findIndex(
          (m) =>
            mNew.from === m.from &&
            mNew.content === m.content &&
            mNew.timestamp === m.timestamp
        );

        if (sentMessageIndex >= 0) {
          this.sentMessages.splice(sentMessageIndex, 1);
          return;
        }

        this.parseNewMessages([mNew]);
      }
    });
  };

  loadChat = () => {
    this.setState({ loaded: true });
  };

  scrollChat = () => {
    const chatContainer = this.refScrollbars.current!;
    chatContainer.autoScroll();
  };

  getClassname = (type: string, from: string | null) => {
    const { code, players } = this.props;

    const user = type === 'client';

    const spectator = from && user && code && !players.includes(from);

    return `message ${type}${spectator ? ' spectator' : ''}`;
  };

  getHour = (timestamp: number) => {
    const d = new Date(timestamp);

    const hours = ('0' + d.getHours()).slice(-2);
    const min = ('0' + d.getMinutes()).slice(-2);
    return `${hours}:${min}`;
  };

  getFrom = (type: string, from: string, to: string[], _public: boolean) => {
    const { username } = this.props;

    const isDm = type === 'direct';
    const iSent = username === from;
    const iReceived = to.includes(username);

    let _from: string | null = userShow.has(type) ? from : null;

    if (isDm) {
      if (iSent) {
        _from = `To ${to[0]}`;
      } else if (iReceived) {
        _from = `From ${from}`;
      }
    }

    return _from;
  };

  getColor = (from: string | null) => {
    if (!from) return '';

    const { players, style } = this.props;

    const index = players.indexOf(from);

    return index !== -1 && style.coloredNames ? `username${index + 1}` : '';
  };

  getHighlight = (from: string | null) => {
    if (!from) return '';

    const { chatHighlights: highlights, code } = this.props;

    return from in highlights && code ? highlights[from] : '';
  };

  messageIds: string[] = [];

  readMessage = (snap: ChatSnapshot): ChatSnapshotRead => {
    const { public: _public, content, type, from, to, timestamp, objectId: id } = snap;

    const f = this.getFrom(type, from, to, _public);

    const output: ChatSnapshotRead = {
      from: f,
      content: content,
      hour: this.getHour(timestamp),
      id,
      timestamp,
      type,
      public: _public,
    };

    this.messageIds.push(id);

    return output;
  };

  clearMessages = () => {
    this.setState({ messages: [] });
  };

  createAnnouncement = (data: any) => {
    Parse.Cloud.run('chatCommands', {
      call: 'newAnnouncement',
      id: data.id,
      title: data.title,
      content: data.content,
    });
  };

  avatarSet = (data: any) => {
    Parse.Cloud.run('chatCommands', {
      call: 'avatarSet',
      target: data.user,
      res: data.res,
      spy: data.spy,
    });
  };

  activateTooFast = () => {
    Soundboard.rejected.play();

    this.setState({ form: FormType.Fast });
  };

  closeForm = () => {
    this.setState({ form: FormType.None });
  };

  writeMessage = async (content: string) => {
    const { dispatch, username, code } = this.props;
    msgBuilder.username = username;

    const quote = /^[0-9]{2}:[0-9]{2} (.*)$/g;

    let output: ChatSnapshot[] = [];

    if (content.startsWith('/')) {
      const split = content.split(' ');

      switch (split[0]) {
        case '/help':
          output = msgBuilder.getCommandHelp({ page: split[1], username });
          break;
        case '/dm':
          output = msgBuilder.sendDirectMessage({ username, code, content, split });
          break;
        case '/slap':
          output = await Parse.Cloud.run('chatCommands', {
            call: 'sendTaunt',
            code,
            to: split[1],
            audio: 'slapped',
          })
            .then(msgBuilder.commandResponseMessage)
            .catch((err) => {
              return [];
            });
          break;
        case '/buzz':
          output = await Parse.Cloud.run('chatCommands', {
            call: 'sendTaunt',
            code,
            to: split[1],
            audio: 'notification',
          })
            .then(msgBuilder.commandResponseMessage)
            .catch((err) => {
              return [];
            });
          break;
        case '/lick':
          output = await Parse.Cloud.run('chatCommands', {
            call: 'sendTaunt',
            code,
            to: split[1],
            audio: 'licked',
          })
            .then(msgBuilder.commandResponseMessage)
            .catch((err) => {
              return [];
            });
          break;
        case '/timeout':
          output = await Parse.Cloud.run('chatCommands', {
            call: 'suspendPlayer',
            target: split[1],
            hours: split[2],
            comment: split[3],
          })
            .then(msgBuilder.commandResponseMessage)
            .catch((err) => {
              return [];
            });
          break;
        case '/untimeout':
          output = await Parse.Cloud.run('chatCommands', {
            call: 'revokeSuspension',
            target: split[1],
            comment: split[2],
          })
            .then(msgBuilder.commandResponseMessage)
            .catch((err) => {
              return [];
            });
          break;
        case '/verify':
          output = await Parse.Cloud.run('chatCommands', {
            call: 'verifyPlayer',
            target: split[1],
            comment: split[2],
          })
            .then(msgBuilder.commandResponseMessage)
            .catch((err) => {
              return [];
            });
          break;
        case '/ban':
          output = await Parse.Cloud.run('chatCommands', {
            call: 'banPlayer',
            target: split[1],
            comment: split[2],
          })
            .then(msgBuilder.commandResponseMessage)
            .catch((err) => {
              return [];
            });
          break;
        case '/unban':
          output = await Parse.Cloud.run('chatCommands', {
            call: 'revokeBan',
            target: split[1],
            comment: split[2],
          })
            .then(msgBuilder.commandResponseMessage)
            .catch((err) => {
              return [];
            });
          break;
        case '/banip':
          output = await Parse.Cloud.run('chatCommands', {
            call: 'banPlayerIP',
            target: split[1],
            comment: split[2],
          })
            .then(msgBuilder.commandResponseMessage)
            .catch((err) => {
              return [];
            });
          break;
        case '/unbanip':
          output = await Parse.Cloud.run('chatCommands', {
            call: 'revokeIPBan',
            target: split[1],
            comment: split[2],
          })
            .then(msgBuilder.commandResponseMessage)
            .catch((err) => {
              return [];
            });
          break;
        case '/logs':
          output = await Parse.Cloud.run('chatCommands', {
            call: 'getLogs',
            target: split[1],
            comment: split[2],
          })
            .then((data) => {
              console.log(data.logs);

              return msgBuilder.commandResponseMessage(data.content);
            })
            .catch((err) => {
              return [];
            });
          break;
        case '/maintenance':
          output = await Parse.Cloud.run('chatCommands', {
            call: 'toggleMaintenance',
          })
            .then(msgBuilder.commandResponseMessage)
            .catch((err) => {
              return [];
            });
          break;
        case '/lockdown':
          output = await Parse.Cloud.run('chatCommands', {
            call: 'toggleLockdown',
          })
            .then(msgBuilder.commandResponseMessage)
            .catch((err) => {
              return [];
            });
          break;
        case '/pause':
          output = await Parse.Cloud.run('chatCommands', {
            call: 'pauseGame',
            target: split[1],
            comment: split[2],
          })
            .then(msgBuilder.commandResponseMessage)
            .catch((err) => {
              return [];
            });
          break;
        case '/unpause':
          output = await Parse.Cloud.run('chatCommands', {
            call: 'unpauseGame',
            target: split[1],
            comment: split[2],
          })
            .then(msgBuilder.commandResponseMessage)
            .catch((err) => {
              return [];
            });
          break;
        case '/end':
          output = await Parse.Cloud.run('chatCommands', {
            call: 'endGame',
            target: split[1],
            outcome: split[2],
            comment: split[3],
          })
            .then(msgBuilder.commandResponseMessage)
            .catch((err) => {
              return [];
            });
          break;
        case '/close':
          output = await Parse.Cloud.run('chatCommands', {
            call: 'closeGame',
            target: split[1],
            comment: split[2],
          })
            .then(msgBuilder.commandResponseMessage)
            .catch((err) => {
              return [];
            });
          break;
        case '/learnroles':
          output = await Parse.Cloud.run('chatCommands', {
            call: 'learnRoles',
            target: split[1],
            comment: split[2],
          })
            .then(msgBuilder.commandResponseMessage)
            .catch((err) => {
              return [];
            });
          break;
        case '/passwordreset':
          output = await Parse.Cloud.run('chatCommands', {
            call: 'requestPasswordReset',
            email: split[1],
          })
            .then(msgBuilder.commandResponseMessage)
            .catch((err) => {
              return [];
            });
          break;
        case '/roll':
          output = msgBuilder.rollDie({ username, split, code });
          break;
        case '/flip':
          output = msgBuilder.flipCoin({ username, code });
          break;
        case '/announce':
          this.setState({ form: FormType.Announce });
          return;
        case '/avatarset':
          this.setState({ form: FormType.Avatar });
          return;
        case '/discordset':
          output = await Parse.Cloud.run('chatCommands', {
            call: 'discordSet',
            url: split[1],
          })
            .then(msgBuilder.commandResponseMessage)
            .catch((err) => {
              return [];
            });
          break;
        default:
          output = msgBuilder.defaultMessage(username);
          break;
      }
    } else if (quote.test(content)) {
      output = msgBuilder.findQuote({
        username,
        content,
        code,
        messages: this.state.messages,
      });
    } else {
      output = msgBuilder.sendMessage({
        username,
        code,
        content: content.trim(),
      });
    }

    dispatch(setMessageDelay());
    this.sentMessages.push(...output);
    this.parseNewMessages(output);
  };

  commandResponseMessage = (content: string) => {
    const { username } = this.props;

    const output: ChatSnapshot[] = msgBuilder.commandResponseMessage({
      username,
      content,
    });

    this.parseNewMessages(output);
  };

  sendMessage = () => {
    const refInput = this.refInput.current!;
    const { messageDelay: delay } = this.props;
    const { content } = refInput.state;
    const { form } = this.state;

    if (content === '' || form === FormType.Fast) return;

    if (content === '/clear') {
      this.clearMessages();
    } else {
      const timestamp = Date.now();

      if (delay[0] > timestamp) {
        this.activateTooFast();
        return;
      }

      this.writeMessage(content);
    }

    refInput.setState({ content: '' });
  };

  parseOldMessages = (messages: ChatSnapshot[]) => {
    if (!this.mounted) {
      queryClient.unsubscribe(this.messageSub);
      return;
    }

    const newMessages = messages.map(this.readMessage);

    this.setState({ messages: newMessages }, this.scrollChat);
  };

  parseNewMessages = (messages: ChatSnapshot[]) => {
    if (!this.mounted) {
      queryClient.unsubscribe(this.messageSub);
      return;
    }

    const newMessages = messages
      .filter((m) => !this.messageIds.includes(m.objectId))
      .map(this.readMessage);

    const messagesToState = [...this.state.messages, ...newMessages];

    this.setState({ messages: messagesToState }, this.scrollChat);
  };

  messageMapper = (snap: ChatSnapshotRead, i: number) => {
    const { adminList, modList, contribList } = this.state;
    const color = this.getColor(snap.from);
    const highlight = this.getHighlight(snap.from);
    const classname = this.getClassname(snap.type, snap.from);

    let tag: any = null;
    if (snap.from) {
      if (adminList.includes(snap.from)) {
        tag = <span className="playerTag admin">A</span>;
      } else if (modList.includes(snap.from)) {
        tag = <span className="playerTag mod">M</span>;
      } else if (contribList.includes(snap.from)) {
        tag = <span className="playerTag contrib">C</span>;
      }
    }

    return (
      <div className={classname} key={snap.id} style={{ backgroundColor: highlight }}>
        <span className={`hour ${color}`}>{snap.hour}</span>
        <p className="text">
          {snap.from ? (
            <span className={`username ${color}`}>
              {tag}
              {snap.from}:
            </span>
          ) : null}
          <span className="content">{snap.content}</span>
        </p>
      </div>
    );
  };

  render() {
    const isReplay = this.props.stage === 'REPLAY';
    const { messages, form, showAllMessages } = this.state;

    const { numberOfMessages } = this.props.style;
    const slicedMessages =
      isReplay || showAllMessages
        ? messages
        : messages.slice(Math.max(0, messages.length - numberOfMessages));

    return (
      <div id="Chat" className="row">
        {this.state.messages.length &&
        (this.props.code === undefined || this.props.code !== '-1') ? (
          <AvalonScrollbars ref={this.refScrollbars} key={'real'}>
            {slicedMessages.map(this.messageMapper)}
          </AvalonScrollbars>
        ) : (
          <AvalonScrollbars ref={this.refScrollbars} key={'fake'} />
        )}
        {isReplay ? null : (
          <form className="message-input" onSubmit={this.handleSubmit}>
            <ChatInput
              ref={this.refInput}
              autoComplete={this.state.playerList}
              showAllMessages={showAllMessages}
              toggleShowAllMessages={this.toggleShowAllMessages}
            />
          </form>
        )}
        {form === FormType.Fast ? <TooFast onExit={this.closeForm} /> : null}
        {form === FormType.Announce ? (
          <AnnouncementForm onSelect={this.createAnnouncement} onExit={this.closeForm} />
        ) : null}
        {form === FormType.Avatar ? (
          <AvatarForm onSelect={this.avatarSet} onExit={this.closeForm} />
        ) : null}
      </div>
    );
  }
}

export default connect(mapState, null)(Chat);
