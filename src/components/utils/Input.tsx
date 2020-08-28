// External

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faHome,
  faLock,
  faUser,
  faEnvelope,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";

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
      <FontAwesomeIcon icon={["fas", props.icon]} />
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

export const ChatInput = (props: ChatInputProps) => {
  return (
    <div className="chat-input">
      <input
        onChange={props.onChange}
        placeholder="Enter your message here."
        value={props.value}
      ></input>
      <button type="submit">
        <FontAwesomeIcon icon={["fas", "paper-plane"]} />
      </button>
    </div>
  );
};
