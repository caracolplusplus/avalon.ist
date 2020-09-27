// External

import React from 'react';
import { useDispatch } from 'react-redux';

// Internal

import Chat from '../Lobby/Chat';
import GameState from './GameState';
import PlayerList from '../Lobby/PlayerList';
import Notes from './Notes';
import VoteHistory from './VoteHistory';

// Styles

import '../../styles/Game/Tabs.scss';

// Types

interface TabProps {
  text: string;
  highlighted: boolean;
  no: number;
}

interface TabContainerProps {
  game: GameState;
  onClick: (no: number, value: boolean) => void;
  initialTab: number;
}

interface TabContainerState {
  tab: number;
}

// Declaration

class Tabs extends React.PureComponent<TabContainerProps, TabContainerState> {
  constructor(props: TabContainerProps) {
    super(props);
    this.state = {
      tab: props.initialTab,
    };
    this.Tab = this.Tab.bind(this);
  }

  Tab(props: TabProps) {
    const highlighted = props.highlighted ? 'highlighted ' : '';
    const selected = this.state.tab === props.no;

    const setTab = () => {
      this.setState({ tab: props.no });
      if (props.no < 2) this.props.onClick(props.no, false)
    };

    return (
      <button className={'tag ' + highlighted + selected} onClick={setTab}>
        <p>{props.text}</p>
      </button>
    );
  }

  render() {
    const routes = [
      <Chat players={[]} stage={'NONE'} key="genChat" />,
      <Chat code={this.props.game.code} players={this.props.game.players} stage={this.props.game.stage} key="gameChat" />,
      <Notes notes="" dispatch={useDispatch} />,
      <VoteHistory game={this.props.game} />,
      <PlayerList code={this.props.game.code} players={this.props.game.players} clients={this.props.game.clients} />,
    ];

    return (
      <div id="Tabs" className="tab">
        <div className="tab-row">
          <this.Tab text="ALL CHAT" no={0} highlighted={this.props.game.highlighted[0]} />
          <this.Tab text="GAME CHAT" no={1} highlighted={this.props.game.highlighted[1]} />
          <this.Tab text="NOTES" no={2} highlighted={false} />
          <this.Tab text="VOTES" no={3} highlighted={false} />
          <this.Tab text="PLAYERS" no={4} highlighted={false} />
        </div>
        {routes[this.state.tab]}
      </div>
    );
  }
}

export default Tabs;
