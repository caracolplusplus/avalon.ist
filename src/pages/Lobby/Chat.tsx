/* globals Set */

// eslint-disable-next-line no-unused-vars
import React, { FormEvent, createRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { rootType } from '../../redux/reducers';
import { setMessageDelay } from '../../redux/actions';
import { connect } from 'react-redux';
import AvalonScrollbars from '../../components/utils/AvalonScrollbars';
import { ChatInput } from '../../components/utils/Input';
import MessageBuilder from './MessageBuilder';
import TooFast from './ChatTooFast';
import socket from '../../socket-io/socket-io';
import Soundboard from '../../sounds/audio';
import AnnouncementForm from './ChatAnnouncementForm';
import AvatarForm from './ChatAvatarForm';
import * as _ from 'lodash';

import '../../styles/Lobby/Chat.scss';

const userShow = new Set(['client', 'help', 'quote', 'direct']);

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
  _public: boolean;
  content: string;
  from: string;
  to: string[];
  type: string;
  timestamp: number;
  id: number;
}

interface ChatSnapshotRead {
  timestamp: number;
  hour: string;
  from: string | null;
  content: string;

  id: number;
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
  form: FormType;
}

const mapState = (state: rootType) => {
  const { chatHighlights, username, messageDelay, style } = state;
  return { chatHighlights, username, messageDelay, style };
};

const generalEvents: string[] = [
  'generalChatResponse',
  'generalChatRequest',
  'messageToGeneral',
  'generalCommandResponse',
];

const gameEvents: string[] = [
  'gameChatResponse',
  'gameChatRequest',
  'messageToGame',
  'gameCommandResponse',
];

const msgBuilder = new MessageBuilder();

class Chat extends React.PureComponent<ChatProps, ChatState> {
  state: ChatState = {
    messages: [],
    playerList: [],
    adminList: [],
    modList: [],
    contribList: [],
    form: FormType.None,
  };

  refScrollbars = createRef<AvalonScrollbars>();
  refInput = createRef<ChatInput>();

  componentDidMount = () => {
    socket.on('playerListResponse', this.playerListResponse);

    socket.emit('playerListRequest');

    this.startChat();
  };

  componentWillUnmount = () => {
    socket.off('playerListResponse', this.playerListResponse);

    this.endChat();
  };

  componentDidUpdate = (prevProps: ChatProps) => {
    const { code } = this.props;
    const { code: _code } = prevProps;

    if (code !== _code) {
      this.endChat();
      this.startChat();
    }
  };

  handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    this.sendMessage();
  };

  playerListResponse = (players: any) => {
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
    const { code } = this.props;
    const events = code ? gameEvents : generalEvents;

    socket.on(events[0], this.parseMessages);
    socket.on(events[3], this.commandResponseMessage);

    this.setState({ messages: [] });

    socket.emit(events[1]);

    this.endChat = () => {
      socket.off(events[0], this.parseMessages);
      socket.off(events[3], this.commandResponseMessage);
    };
  };

  endChat = () => {
    // This function is defined when chat is started
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

  readMessage = (snap: ChatSnapshot): ChatSnapshotRead => {
    const { _public, content, type, from, to, timestamp, id } = snap;

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

    return output;
  };

  clearMessages = () => {
    this.setState({ messages: [] });
  };

  createAnnouncement = (data: any) => {
    socket.emit('createAnnouncement', data);
  };

  avatarSet = (data: any) => {
    socket.emit('avatarSet', data);
  };

  activateTooFast = () => {
    Soundboard.rejected.play();

    this.setState({ form: FormType.Fast });
  };

  closeForm = () => {
    this.setState({ form: FormType.None });
  };

  writeMessage = (content: string) => {
    const { dispatch, username, code } = this.props;
    const events = code ? gameEvents : generalEvents;
    msgBuilder.setEmission(events[2]);

    const quote = /^[0-9]{2}:[0-9]{2} (.*)$/g;

    let output: ChatSnapshot[] = [];

    if (content.startsWith('/')) {
      const split = content.split(' ');

      const commandDefault = {
        isGeneral: !code,
        username,
        target: split[1],
        comment: split[2] ? content.slice(content.indexOf(split[2])) : 'No comment.',
      };

      switch (split[0]) {
        case '/help':
          output = msgBuilder.getCommandHelp({ page: split[1], username });
          break;
        case '/dm':
          output = msgBuilder.sendDirectMessage({ username, content, split });
          break;
        case '/slap':
          socket.emit('sendNotification', {
            isGeneral: !code,
            target: split[1] ? split[1] : '',
            audio: 'slapped',
            message: `You have been slapped by ${username}`,
          });
          break;
        case '/buzz':
          socket.emit('sendNotification', {
            isGeneral: !code,
            target: split[1] ? split[1] : '',
            audio: 'notification',
            message: `You have been buzzed by ${username}`,
          });
          break;
        case '/lick':
          socket.emit('sendNotification', {
            isGeneral: !code,
            target: split[1] ? split[1] : '',
            audio: 'licked',
            message: `You have been licked by ${username}`,
          });
          break;
        case '/ss':
          socket.emit('suspendPlayer', {
            isGeneral: !code,
            username,
            target: split[1],
            hours: split[2],
            comment: split[3] ? content.slice(content.indexOf(split[3])) : 'No comment.',
          });
          break;
        case '/unss':
          socket.emit('revokeSuspension', commandDefault);
          break;
        case '/verify':
          socket.emit('verifyPlayer', commandDefault);
          break;
        case '/ban':
          socket.emit('banPlayer', commandDefault);
          break;
        case '/unban':
          socket.emit('revokeBan', commandDefault);
          break;
        case '/banip':
          socket.emit('banPlayerIP', commandDefault);
          break;
        case '/unbanip':
          socket.emit('revokeIPBan', commandDefault);
          break;
        case '/logs':
          socket.emit('getLogs', { isGeneral: !code });
          break;
        case '/maintenance':
          socket.emit('toggleMaintenance', { isGeneral: !code });
          break;
        case '/lockdown':
          socket.emit('toggleLockdown', { isGeneral: !code });
          break;
        case '/pause':
          socket.emit('pauseGame', commandDefault);
          break;
        case '/unpause':
          socket.emit('unpauseGame', commandDefault);
          break;
        case '/end':
          socket.emit('endGame', {
            isGeneral: !code,
            username,
            target: split[1],
            outcome: split[2],
            comment: split[3] ? content.slice(content.indexOf(split[3])) : 'No comment.',
          });
          break;
        case '/close':
          socket.emit('closeGame', commandDefault);
          break;
        case '/learnroles':
          socket.emit('learnRoles', commandDefault);
          break;
        case '/passwordreset':
          socket.emit('requestPasswordReset', {
            isGeneral: !code,
            email: split[1],
          });
          break;
        case '/roll':
          output = msgBuilder.rollDie({ username, split });
          break;
        case '/flip':
          output = msgBuilder.flipCoin({ username });
          break;
        case '/announce':
          this.setState({ form: FormType.Announce });
          return;
        case '/avatarset':
          this.setState({ form: FormType.Avatar });
          return;
        case '/discordset':
          socket.emit('discordSet', {
            isGeneral: !code,
            url: split[1],
          });
          break;
        default:
          output = msgBuilder.defaultMessage(username);
          break;
      }
    } else if (quote.test(content)) {
      output = msgBuilder.findQuote({ username, content, messages: this.state.messages });
    } else {
      output = msgBuilder.sendMessage({
        username,
        content: content.substr(0, 250).trim(),
      });
    }

    dispatch(setMessageDelay());
    this.parseMessages(output);
  };

  commandResponseMessage = (content: string) => {
    const { username } = this.props;

    const output: ChatSnapshot[] = msgBuilder.commandResponseMessage({
      username,
      content,
    });

    this.parseMessages(output);
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

  parseMessages = _.throttle((messages: ChatSnapshot[]) => {
    const { username, code } = this.props;
    const messageIds = this.state.messages.map((m) => m.id);

    const newMessages = messages
      .filter(
        (m) =>
          !messageIds.includes(m.id) &&
          (m._public || m.from === username || m.to.includes(username))
      )
      .map(this.readMessage);

    const messagesToState = [...this.state.messages, ...newMessages];

    this.setState(
      { messages: code ? messagesToState : messagesToState.slice(-50) },
      this.scrollChat
    );
  }, 50);

  messageMapper = (snap: ChatSnapshotRead) => {
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
      <div
        className={classname}
        key={snap.id.toString() + snap.content.split(' ')[0]}
        style={{ backgroundColor: highlight }}
      >
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
    const { messages, form } = this.state;

    return (
      <div id="Chat" className="row">
        {this.state.messages.length &&
        (this.props.code === undefined || this.props.code !== '-1') ? (
          <AvalonScrollbars ref={this.refScrollbars} key={'real'}>
            {messages.map(this.messageMapper)}
          </AvalonScrollbars>
        ) : (
          <AvalonScrollbars ref={this.refScrollbars} key={'fake'} />
        )}
        {this.props.stage === 'REPLAY' ? null : (
          <form className="message-input" onSubmit={this.handleSubmit}>
            <ChatInput ref={this.refInput} autoComplete={this.state.playerList} />
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
