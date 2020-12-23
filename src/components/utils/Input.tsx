// External

// eslint-disable-next-line no-unused-vars
import React, { ChangeEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faHome,
  faLock,
  faUser,
  faEnvelope,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';

library.add(faHome, faLock, faUser, faEnvelope, faPaperPlane);

// Declaration

interface InputProps {
  icon: any;
  name: string;
  placeholder: string;
  onChange: (...args: any[]) => void;
  type: string;
}

interface ChatInputProps {
  onChange: (...args: any[]) => void;
  value: string;
}

export const Input = (props: InputProps) => {
  return (
    <div className="input">
      <FontAwesomeIcon icon={['fas', props.icon]} />
      <input
        name={props.name}
        placeholder={props.placeholder}
        onChange={props.onChange}
        type={props.type}
        required
      ></input>
    </div>
  );
};

export class ChatInput extends React.PureComponent<{}, { content: string }> {
  constructor(props: {}) {
    super(props);
    this.state = {
      content: '',
    };
  }

  changeInput = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      content: event.target.value.slice(0, 250),
    });
  };

  render() {
    return (
      <div className="chat-input">
        <input
          onChange={this.changeInput}
          placeholder="Enter your message here."
          value={this.state.content}
        ></input>
        <button type="submit">
          <FontAwesomeIcon icon={['fas', 'paper-plane']} />
        </button>
      </div>
    );
  }
}
