// External

import React, { Component } from "react";

// Internal

import AvalonScrollbars from "../components/utils/AvalonScrollbars";

import Navbar from "./Navbar";
import Announcements from "./Lobby/Announcements";
import NewAvatars from "./Lobby/NewAvatars";
import PlayerList from "./Lobby/PlayerList";
import Chat from "./Lobby/Chat";
import GameList from "./Lobby/GameList";

// Styles

import "../styles/Lobby.scss";

// Declaration

class Lobby extends Component {
  initialHeight = Math.max(window.innerHeight, 630);

  render() {
    return (
      <div id="Background-2" className="light full">
        <Navbar username="" />
        <AvalonScrollbars>
          <div
            id="Lobby"
            className="section"
            style={{ minHeight: this.initialHeight + "px" }}
          >
            <div className="column section">
              <div id="Welcome" className="row" />
              <Announcements />
              <NewAvatars />
              <PlayerList />
            </div>
            <div className="column section">
              <Chat />
            </div>
            <div className="column section">
              <GameList />
            </div>
          </div>
        </AvalonScrollbars>
      </div>
    );
  }
}

export default Lobby;
