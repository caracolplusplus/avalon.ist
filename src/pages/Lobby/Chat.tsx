// External

import React, { ChangeEvent, FormEvent, createRef } from 'react';
import { Link } from 'react-router-dom';

// Internal

import socket from '../../socket-io/socket-io';
import AvalonScrollbars from '../../components/utils/AvalonScrollbars';
import { ChatInput } from '../../components/utils/Input';

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
}

interface ChatProps {
  code?: string;
  players: string[];
  stage?: string;
}

interface ChatState {
  messages: ChatSnapshot[];
  content: string;
}

class Chat extends React.PureComponent<ChatProps, ChatState> {
  scrollbars = createRef<AvalonScrollbars>();
  eventNames: string[] = ['generalChatUpdate', 'generalChatResponse', 'generalChatRequest', 'messageToGeneral'];

  constructor(props: ChatProps) {
    super(props);
    this.state = {
      messages: [],
      content: '',
    };
    this.toGameChat = this.toGameChat.bind(this);
    this.startChat = this.startChat.bind(this);
    this.endChat = this.endChat.bind(this);
    this.triggerRequest = this.triggerRequest.bind(this);
    this.parseChat = this.parseChat.bind(this);
    this.handleChange = this.handleChange.bind(this);
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

    const chatContainer = this.scrollbars.current!;
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
    socket.emit(this.eventNames[2]);
  }

  parseChat(messages: ChatSnapshot[]) {
    this.setState({
      messages,
    });
  }

  handleChange(event: ChangeEvent<HTMLInputElement>) {
    this.setState({
      content: event.target.value,
    });
  }

  handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (this.state.content === '') return;

    socket.emit(this.eventNames[3], {
      content: this.state.content,
      roomNumber: this.props.code,
    });

    this.setState({ content: '' });
  }

  chatMessage(snap: ChatSnapshot) {
    const classType = ['client ', 'server ', 'broadcast '][snap.type];
    const classCharacter = ['negative ', 'neutral ', 'positive ', 'highlighted '][snap.character + 1];
    const classSpectator =
      !this.props.players.includes(snap.author) && this.props.code !== undefined && snap.type === 0 ? 'spectator' : '';

    const messageClass = classType + classCharacter + classSpectator;
    const messageAuthor = snap.type < 1 ? snap.author : undefined;
    const messageContent = snap.content;

    const messageDate = new Date(snap.timestamp);
    const messageHour = ('0' + messageDate.getHours()).slice(-2) + ':' + ('0' + messageDate.getMinutes()).slice(-2);

    return (
      <div className={'message ' + messageClass}>
        <span className="hour">{messageHour}</span>
        <p className="text">
          {messageAuthor ? (
            <Link className="username" to={'/profile/' + messageAuthor}>
              {messageAuthor}:
            </Link>
          ) : null}
          <span className="content">{messageContent}</span>
        </p>
      </div>
    );
  }

  render() {
    return (
      <div id="Chat" className="row">
        {this.state.messages.length && (this.props.code === undefined || this.props.code !== '-1') ? (
          <AvalonScrollbars ref={this.scrollbars} key={'real'}>
            {this.state.messages.map((s, i) => (
              <this.chatMessage {...s} key={'message' + i} />
            ))}
          </AvalonScrollbars>
        ) : (
          <AvalonScrollbars ref={this.scrollbars} key={'fake'} />
        )}
        {this.props.stage === 'REPLAY' ? null : (
          <form className="message-input" onSubmit={this.handleSubmit}>
            <ChatInput onChange={this.handleChange} value={this.state.content} />
          </form>
        )}
      </div>
    );
  }
}

export default Chat;
