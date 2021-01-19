// External

// eslint-disable-next-line no-unused-vars
import React, { ChangeEvent, KeyboardEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faHome,
  faLock,
  faUser,
  faEnvelope,
  faPaperPlane,
  faEye,
  faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';

library.add(faHome, faLock, faUser, faEnvelope, faPaperPlane, faEye, faEyeSlash);

// Declaration

interface InputProps {
  icon: any;
  name: string;
  placeholder: string;
  onChange: (...args: any[]) => void;
  type: string;
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

interface ChatInputProps {
  autoComplete: string[];
  toggleShowAllMessages: () => void;
  showAllMessages: boolean;
}

interface ChatInputState {
  content: string;
  autoCompleteWord: string;
  lastAutoCompleteWord: string;
  tabbing: boolean;
}

export class ChatInput extends React.PureComponent<ChatInputProps, ChatInputState> {
  constructor(props: ChatInputProps) {
    super(props);
    this.state = {
      content: '',
      autoCompleteWord: '',
      lastAutoCompleteWord: '',
      tabbing: false,
    };
  }

  changeInput = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      content: event.target.value.slice(0, 250),
    });
  };

  tabComplete = (event: KeyboardEvent<HTMLInputElement>) => {
    // Only tab complete if we have stuff to complete on and we are at the end of the input.
    if (event.key === 'Tab' &&
        event.currentTarget &&
        this.props.autoComplete.length > 0 &&
        event.currentTarget.selectionStart === this.state.content.length) {
      event.preventDefault();
      // Get the word being completed.
      const t = event.currentTarget;
      let start = t.value.lastIndexOf(' ');
      // If no space, then start at the beginning, and if there is a space, skip it...
      start = start === -1 ? 0 : start + 1;
      // If we are already tabbing, get the word we were tabbing on since the
      // content will have been auto-completed already. Otherwise, fetch it.
      let word = this.state.tabbing ? this.state.autoCompleteWord : '';
      if (word.length === 0) {
        word = t.value.substring(start).toLowerCase();
      }
      const matches = this.props.autoComplete.filter( player => player.toLowerCase().startsWith(word) );
      // No matches...bail.
      if (matches.length === 0) {
        this.setState({ tabbing: true })
        return;
      }
      // Find the index of the last item, if there is no past item, it will return -1.
      // However, we increment that to 0 below, so it will return the first result.
      const autoCompleteIndex = matches.indexOf(this.state.lastAutoCompleteWord);
      const newIndex = (autoCompleteIndex + 1) % matches.length;
      // Perform the completion and save the tab completion state.
      const content = t.value.substring(0, start) + matches[newIndex];
      this.setState({
        content: content,
        autoCompleteWord: word,
        lastAutoCompleteWord: matches[newIndex],
        tabbing: true,
      });
    } else if (this.state.tabbing) {
      // Once we stop tabbing, wipe the state so we don't taint future tabs.
      this.setState({
        autoCompleteWord: '',
        lastAutoCompleteWord: '',
        tabbing: false,
      });
    }
  }

  render() {
    return (
      <div className="chat-input">
        <input
          onChange={this.changeInput}
          onKeyDown={this.props.autoComplete ? this.tabComplete : _ => {}}
          placeholder="Enter your message here."
          value={this.state.content}
        ></input>
        <button
          onClick={() => this.props.toggleShowAllMessages()}
        >
          <FontAwesomeIcon icon={this.props.showAllMessages ? faEye : faEyeSlash} />
        </button>
        <button type="submit">
          <FontAwesomeIcon icon={['fas', 'paper-plane']} />
        </button>
      </div>
    );
  }
}
