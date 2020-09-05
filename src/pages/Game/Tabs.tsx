// External

import React, { Component } from "react";
import { useDispatch } from "react-redux";

// Internal

import Chat from "../Lobby/Chat";
import GameState from "./GameState";
import PlayerList from "../Lobby/PlayerList";
import Notes from "./Notes";
import VoteHistory from "./VoteHistory";

// Styles

import "../../styles/Game/Tabs.scss";

// Declaration

interface TabProps {
  text: string;
  no: number;
}

interface TabContainerProps {
  game: GameState;
  initialTab: number;
}

interface TabContainerState {
  tab: number;
}

class Tabs extends React.PureComponent<TabContainerProps, TabContainerState> {
  constructor(props: TabContainerProps) {
    super(props);
    this.state = {
      tab: props.initialTab,
    };
    this.Tab = this.Tab.bind(this);
  }

  Tab(props: TabProps) {
    const setTab = () => this.setState({ tab: props.no });
    const selected = this.state.tab === props.no;

    return (
      <button className={"tag " + selected} onClick={setTab}>
        <p>{props.text}</p>
      </button>
    );
  }

  render() {
    const routes = [
      <Chat key="genChat"/>,
      <Chat code={this.props.game.code} players={this.props.game.players} key="gameChat"/>,
      <Notes notes="" dispatch={useDispatch} />,
      <VoteHistory game={this.props.game} />,
      <PlayerList game={true} players={this.props.game.players} clients={this.props.game.clients}/>,
    ];

    return (
      <div id="Tabs" className="tab">
        <div className="tab-row">
          <this.Tab text="ALL CHAT" no={0} />
          <this.Tab text="GAME CHAT" no={1} />
          <this.Tab text="NOTES" no={2} />
          <this.Tab text="VOTES" no={3} />
          <this.Tab text="PLAYERS" no={4} />
        </div>
        {routes[this.state.tab]}
      </div>
    );
  }
}

export default Tabs;
