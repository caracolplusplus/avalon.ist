// External

import React, { Component, ChangeEvent, FormEvent, createRef } from 'react';
import { Link } from 'react-router-dom';

// Internal

import socket from '../../socket-io/socket-io';
import AvalonScrollbars from '../../components/utils/AvalonScrollbars';
import { ChatInput } from '../../components/utils/Input';

// Styles

import '../../styles/Lobby/Chat.scss';

// Declaration

interface ChatMessageProps {
  public: boolean;
  content: string;
  author: string;
  to: string[];
  type: number;
  character: number;
  timestamp: number;
}

interface ChatProps {
  code?: number;
}

interface ChatState {
  messages: ChatMessageProps[];
  content: string;
}

const ChatMessage = (props: ChatMessageProps) => {
  const messageDate = new Date(props.timestamp);
  const typeClass = ['client ', 'server ', 'broadcast '][props.type];
  const characterClass = ['negative', 'neutral', 'positive', 'highlighted'][props.character + 1];

  return (
    <div className={'message ' + typeClass + characterClass}>
      <span className="hour">
        {('0' + messageDate.getHours()).slice(-2) + ':' + ('0' + messageDate.getMinutes()).slice(-2)}
      </span>
      <p className="text">
        {props.type < 1 ? (
          <Link className="username" to={'/profile/' + props.author}>
            {props.author}:
          </Link>
        ) : null}
        <span className="content">{props.content}</span>
      </p>
    </div>
  );
};

class Chat extends Component<ChatProps, ChatState> {
  scrollbars = createRef<AvalonScrollbars>();
  eventNames: string[] = [
    'generalChatUpdate',
    'generalChatResponse',
    'generalChatJoin',
    'generalChatLeave',
    'generalChatRequest',
    'messageToGeneral',
  ];

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
  }

  componentDidMount() {
    if (this.props.code === undefined) {
      this.startChat();
    } else if (this.props.code > -1) {
      this.toGameChat();
      this.startChat();
    }
  }

  componentWillUnmount() {
    this.endChat();
  }

  componentDidUpdate(prevProps: ChatProps) {
    if (prevProps.code !== this.props.code && this.props.code && this.props.code > -1) {
      this.toGameChat();
      this.startChat();
    }

    const chatContainer = this.scrollbars.current!;
    chatContainer.autoScroll();
  }

  toGameChat() {
    this.eventNames = [
      'gameChatUpdate',
      'gameChatResponse' + this.props.code,
      'gameChatJoin',
      'gameChatLeave',
      'gameChatRequest',
      'messageToGame',
    ];
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
    socket.emit(this.eventNames[4], {
      roomNumber: this.props.code,
    });
  }

  parseChat(messages: ChatMessageProps[]) {
    this.setState({ messages });
  }

  handleChange(event: ChangeEvent<HTMLInputElement>) {
    this.setState({
      content: event.target.value,
    });
  }

  handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (this.state.content === '') return;
    socket.emit(this.eventNames[5], {
      content: this.state.content,
      roomNumber: this.props.code,
    });

    this.setState({ content: '' });
  }

  render() {
    return (
      <div id="Chat" className="row">
        <AvalonScrollbars ref={this.scrollbars}>
          {this.state.messages.map((m, i) => (
            <ChatMessage {...m} key={'message' + i} />
          ))}
        </AvalonScrollbars>
        <form className="message-input" onSubmit={this.handleSubmit}>
          <ChatInput onChange={this.handleChange} value={this.state.content} />
        </form>
      </div>
    );
  }
}

export default Chat;
