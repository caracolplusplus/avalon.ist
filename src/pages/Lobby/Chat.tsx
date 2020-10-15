// External

import React, { FormEvent, createRef } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

// Internal

import socket from '../../socket-io/socket-io';
import Soundboard from '../../sounds/audio';
import AvalonScrollbars from '../../components/utils/AvalonScrollbars';
import { ChatInput } from '../../components/utils/Input';
import { rootType } from '../../redux/reducers';
import { setMessageDelay } from '../../redux/actions';
import TooFast from './ChatTooFast';

// Styles

import '../../styles/Lobby/Chat.scss';

// Declaration

interface ChatSnapshot {
  public: boolean;
  content: string;
  author: string;
  to: string[];
  type: number;
  character: number;
  timestamp: number;
  id: number;
}

interface ChatProps {
  dispatch?: any;
  messageDelay?: any;
  code?: string;
  players: string[];
  stage?: string;
  chatHighlights: { [key: string]: string };
  username: string;
}

interface ChatState {
  messages: ChatSnapshot[];
  tooFast: boolean;
}

const mapState = (state: rootType) => {
  const { chatHighlights, username, messageDelay } = state;
  return { chatHighlights, username, messageDelay };
};

class Chat extends React.PureComponent<ChatProps, ChatState> {
  refScrollbars = createRef<AvalonScrollbars>();
  refInput = createRef<ChatInput>();

  eventNames: string[] = ['generalChatUpdate', 'generalChatResponse', 'generalChatRequest', 'messageToGeneral'];
  eventTimestamp = 0;

  constructor(props: ChatProps) {
    super(props);
    this.state = {
      messages: [],
      tooFast: false,
    };
    this.toGameChat = this.toGameChat.bind(this);
    this.startChat = this.startChat.bind(this);
    this.endChat = this.endChat.bind(this);
    this.triggerRequest = this.triggerRequest.bind(this);
    this.parseChat = this.parseChat.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.chatMessage = this.chatMessage.bind(this);
  }

  componentDidMount() {
    if (this.props.code === undefined) {
      this.startChat();
    } else if (this.props.code !== '-1') {
      this.toGameChat();
      this.startChat();
    }
  }

  componentWillUnmount() {
    this.endChat();
  }

  componentDidUpdate(prevProps: ChatProps) {
    if (prevProps.code !== this.props.code && this.props.code !== undefined && this.props.code !== '-1') {
      this.toGameChat();
      this.startChat();
    }

    const chatContainer = this.refScrollbars.current!;
    chatContainer.autoScroll();
  }

  toGameChat() {
    this.eventNames = ['gameChatUpdate', 'gameChatResponse' + this.props.code, 'gameChatRequest', 'messageToGame'];
  }

  startChat() {
    socket.on(this.eventNames[0], this.triggerRequest);
    socket.on(this.eventNames[1], this.parseChat);

    this.triggerRequest();
  }

  endChat() {
    socket.off(this.eventNames[0], this.triggerRequest);
    socket.off(this.eventNames[1], this.parseChat);
  }

  triggerRequest() {
    const messagesLength = this.state.messages.length;
    const messagesLast = this.state.messages[messagesLength - 1];

    if (messagesLength > 0) this.eventTimestamp = messagesLast.id;

    socket.emit(this.eventNames[2], this.eventTimestamp);
  }

  parseChat(messagesNew: ChatSnapshot[]) {
    let messages = [...this.state.messages];

    if (messages.length > 0) {
      const messagesLength = messages.length;
      const messagesNewLength = messagesNew.length;
      const messagesLast = messages[messagesLength - 1];

      const messagesFiltered = [];

      for (let i = messagesNewLength - 1; i >= 0; i--) {
        const message = messagesNew[i];

        if (message.id <= messagesLast.id) break;

        messagesFiltered.unshift(message);
      }

      messages = messages.concat(messagesFiltered);
    } else {
      messages = messagesNew;
    }

    this.setState({ messages });
  }

  cancelTooFast = () => this.setState({ tooFast: false });

  handleSubmit(event: FormEvent) {
    event.preventDefault();

    const content = this.refInput.current!.state.content;

    if (!content || content === '' || this.state.tooFast) return;

    if (/^\/clear(.*)$/.test(content)) {
      const messagesLength = this.state.messages.length;
      if (messagesLength) this.eventTimestamp = this.state.messages[messagesLength - 1].timestamp;

      this.setState({ messages: [] });
    } else {
      if (this.props.messageDelay[0] > Date.now()) {
        Soundboard.rejected.play();
        this.setState({ tooFast: true });
        return;
      }

      this.props.dispatch(setMessageDelay());

      socket.emit(this.eventNames[3], {
        content: content,
        roomNumber: this.props.code,
      });
    }

    this.refInput.current!.setState({ content: '' });
  }

  chatMessage(snap: ChatSnapshot) {
    const classType = ['client ', 'server ', 'broadcast '][snap.type];
    const classCharacter = ['negative ', 'neutral ', 'positive ', 'highlighted ', 'command ', 'quote '][
      snap.character + 1
    ];
    const classSpectator =
      !this.props.players.includes(snap.author) && this.props.code !== undefined && snap.type === 0 ? 'spectator' : '';

    const messageClass = classType + classCharacter + classSpectator;
    const messageAuthor = snap.type !== 1 ? snap.author : undefined;
    const messageContent = snap.content;
    const messageHighlight =
      messageAuthor && messageAuthor in this.props.chatHighlights ? this.props.chatHighlights[messageAuthor] : '';

    const messageDate = new Date(snap.timestamp);
    const messageHour = ('0' + messageDate.getHours()).slice(-2) + ':' + ('0' + messageDate.getMinutes()).slice(-2);

    const isDm = snap.type === 0 && snap.character === 3;
    const iSent = this.props.username === snap.author;
    const iReceived = this.props.username === snap.to[0];

    return (
      <div className={'message ' + messageClass} style={{ backgroundColor: messageHighlight }}>
        <span className="hour">{messageHour}</span>
        <p className="text">
          {messageAuthor ? (
            <Link className="username" to={'/profile/' + messageAuthor}>
              {isDm
                ? iSent
                  ? 'To ' + snap.to[0]
                  : iReceived
                  ? 'From ' + messageAuthor
                  : messageAuthor + ' to ' + snap.to[0]
                : messageAuthor}
              :
            </Link>
          ) : null}
          <span className="content">{messageContent}</span>
        </p>
      </div>
    );
  }

  render() {
    const messagesMapped: JSX.Element[] = [];

    for (const x in this.state.messages) {
      const s = this.state.messages[x];
      messagesMapped.push(<this.chatMessage {...s} key={'message' + x} />);
    }

    return (
      <div id="Chat" className="row">
        {this.state.messages.length && (this.props.code === undefined || this.props.code !== '-1') ? (
          <AvalonScrollbars ref={this.refScrollbars} key={'real'}>
            {messagesMapped}
          </AvalonScrollbars>
        ) : (
          <AvalonScrollbars ref={this.refScrollbars} key={'fake'} />
        )}
        {this.props.stage === 'REPLAY' ? null : (
          <form className="message-input" onSubmit={this.handleSubmit}>
            <ChatInput ref={this.refInput} />
          </form>
        )}
        {this.state.tooFast ? <TooFast onExit={this.cancelTooFast} /> : null}
      </div>
    );
  }
}

export default connect(mapState, null)(Chat);
