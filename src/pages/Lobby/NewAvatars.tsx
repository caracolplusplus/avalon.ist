// External

import React, { Component } from "react";

// Styles

import "../../styles/Lobby/NewAvatars.scss";

// Declaration

interface AvatarProps {
  url: string;
}

const Avatar = (props: AvatarProps) => {
  return (
    <div
      className="avatar"
      style={{ backgroundImage: "url(" + props.url + ")" }}
    />
  );
};

class NewAvatars extends Component {
  render() {
    return (
      <div id="New-Avatars" className="row">
        <h3>
          <p>BRAND NEW AVATARS</p>
        </h3>
        <div className="ave-container">
          <Avatar url="https://cdn.discordapp.com/attachments/688596182758326313/732067339746541628/base-res.png" />
          <Avatar url="https://cdn.discordapp.com/attachments/688596182758326313/732067339746541628/base-res.png" />
          <Avatar url="https://cdn.discordapp.com/attachments/688596182758326313/732067339746541628/base-res.png" />
        </div>
      </div>
    );
  }
}

export default NewAvatars;
