// External

import React, { Component } from "react";
import { Link } from "react-router-dom";

// Internal

import socket from "../../socket-io/socket-io";
import AvalonScrollbars from "../../components/utils/AvalonScrollbars";

// Import Styles

import "../../styles/Lobby/PlayerList.scss";

// Declaration

interface PlayerProps {
  username: string;
}

interface PlayerTabProps {
  players: PlayerProps[];
  title: string;
}

interface PlayerTabState {
  showTab: boolean;
}

interface PlayerListState {
  areAdmins: PlayerProps[];
  areContribs: PlayerProps[];
  arePlayers: PlayerProps[];
  loaded: boolean;
}

const Player = (props: PlayerProps) => {
  return (
    <p className="player">
      <Link className="player-name" to={"/profile/" + props.username}>
        {props.username}
      </Link>
      <span className="player-elo">1500</span>
    </p>
  );
};

class PlayerTab extends Component<PlayerTabProps, PlayerTabState> {
  constructor(props: PlayerTabProps) {
    super(props);
    this.state = {
      showTab: true,
    };
    this.toggleTab = this.toggleTab.bind(this);
  }

  toggleTab() {
    this.setState({ showTab: !this.state.showTab });
  }

  render() {
    return (
      <div className="the-whole-tab">
        <p className="tab-title">
          <button onClick={this.toggleTab}>
            <i className={this.state.showTab ? "arrow up" : "arrow down"} />
          </button>
          <span>
            {this.props.title}({this.props.players.length})
          </span>
        </p>
        {this.state.showTab ? (
          <div className="player-tab">
            {this.props.players.map((p, i) => (
              <Player username={p.username} key={"Player" + i} />
            ))}
          </div>
        ) : null}
      </div>
    );
  }
}

class PlayerList extends Component<{}, PlayerListState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      areAdmins: [],
      areContribs: [],
      arePlayers: [],
      loaded: true,
    };
    this.parseClientsOnline = this.parseClientsOnline.bind(this);
  }

  componentDidMount() {
    socket
      .on("clientsOnlineResponse", this.parseClientsOnline)
      .emit("clientsOnlineRequest");
  }

  componentWillUnmount() {
    socket.off("clientsOnlineResponse", this.parseClientsOnline);
  }

  parseClientsOnline(data: any) {
    console.log(data);
  }

  render() {
    return (
      <div id="Player-List" className="row">
        <h3>
          <p>PLAYER LIST</p>
        </h3>
        {this.state.loaded ? (
          <AvalonScrollbars>
            <PlayerTab title="Moderators" players={this.state.areAdmins} />
            <PlayerTab title="Contributors" players={this.state.areContribs} />
            <PlayerTab title="Players" players={this.state.arePlayers} />
          </AvalonScrollbars>
        ) : null}
      </div>
    );
  }
}

export default PlayerList;
