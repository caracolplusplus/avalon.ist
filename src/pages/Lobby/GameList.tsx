// External

import React, { Component } from "react";
import { Link } from "react-router-dom";

// Internal

import socket from "../../socket-io/socket-io";
import AvalonScrollbars from "../../components/utils/AvalonScrollbars";

import GameForm from "./GameForm";

// Styles

import "../../styles/Lobby/GameList.scss";

// Declaration

interface AvatarProps {
  url: string;
}

interface GameLinkProps {
  no: string;
}

interface GameLinkState {
  results: (boolean | undefined)[];
  avatars: string[];
  host: string;
  mode: string;
  spectators: number;
  gameState: -1 | 0 | 1 | 2 | 3 | 4;
}

interface GameListState {
  gameIds: string[];
  showCreate: boolean;
}

const Avatar = (props: AvatarProps) => {
  return (
    <div
      className="avatar"
      style={{ backgroundImage: "url(" + props.url + ")" }}
    />
  );
};

class GameLink extends Component<GameLinkProps, GameLinkState> {
  gameStateClass = ["waiting", "in-progress", "finished", "paused", "frozen"];
  gameState = ["Waiting", "In Progress", "Finished", "Paused", "Frozen"];

  constructor(props: GameLinkProps) {
    super(props);
    this.state = {
      results: [],
      avatars: [],
      host: "",
      mode: "",
      spectators: -1,
      gameState: -1,
    };
    this.triggerRequest = this.triggerRequest.bind(this);
    this.parseRoomLink = this.parseRoomLink.bind(this);
  }

  componentDidMount() {
    socket.on("roomLinkUpdate" + this.props.no, this.triggerRequest);
    socket.on("roomLinkResponse" + this.props.no, this.parseRoomLink);

    socket.emit("roomLinkJoin", {
      roomNumber: this.props.no,
    });
  }

  componentWillUnmount() {
    socket.off("roomLinkUpdate" + this.props.no, this.triggerRequest);
    socket.off("roomLinkResponse" + this.props.no, this.parseRoomLink);

    socket.emit("roomLinkLeave", {
      roomNumber: this.props.no,
    });
  }

  triggerRequest() {
    socket.emit("roomLinkRequest", {
      roomNumber: this.props.no,
    });
  }

  parseRoomLink(data: GameLinkState) {
    this.setState(data);
  }

  render() {
    return (
      <Link className="game" to={"/game/" + this.props.no}>
        <h3>
          <p>ROOM {"#" + this.props.no}</p>
          {this.state.gameState > -1 ? (
            <p className={this.gameStateClass[this.state.gameState]}>
              {this.gameState[this.state.gameState]}
            </p>
          ) : null}
        </h3>
        <p className="tracker">
          {this.state.results.map((r, i) => (
            <span key={i} className={"mission " + r} />
          ))}
        </p>
        <p>
          <span className="title">HOST:</span>
          {this.state.host}
        </p>
        <p>
          <span className="title">MODE:</span>
          {this.state.mode}
        </p>
        <p>
          <span className="title">SPECTATORS:</span>
          {this.state.spectators}
        </p>
        <div className="avatars">
          {this.state.avatars.map((r, i) => (
            <Avatar key={i} url={r} />
          ))}
        </div>
      </Link>
    );
  }
}

// Class

class GameList extends Component<{}, GameListState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      gameIds: [],
      showCreate: false,
    };
    this.triggerRequest = this.triggerRequest.bind(this);
    this.parseRoomList = this.parseRoomList.bind(this);
  }

  componentDidMount() {
    socket.on("roomListUpdate", this.triggerRequest);
    socket.on("roomListResponse", this.parseRoomList);

    socket.emit("roomListJoin");
    this.triggerRequest();
  }

  componentWillUnmount() {
    socket.off("roomListUpdate", this.triggerRequest);
    socket.off("roomListResponse", this.parseRoomList);

    socket.emit("roomListLeave");
  }

  triggerRequest() {
    socket.emit("roomListRequest");
  }

  parseRoomList(data: string[]) {
    this.setState({ gameIds: data });
  }

  render() {
    return (
      <div id="Game-List" className="row">
        <h3>
          <p>CURRENT GAMES</p>
        </h3>
        <div className="game-list-settings">
          <button
            className="game-list-create"
            onClick={() =>
              this.setState({ showCreate: !this.state.showCreate })
            }
          >
            CREATE
          </button>
        </div>
        <AvalonScrollbars>
          {this.state.gameIds
            .map((id) => <GameLink no={id} key={"Game" + id} />)
            .reverse()}
        </AvalonScrollbars>
        {this.state.showCreate ? (
          <GameForm
            title="CREATE A NEW GAME"
            onExit={() => this.setState({ showCreate: false })}
            createsGame={true}
          />
        ) : null}
      </div>
    );
  }
}

export default GameList;
