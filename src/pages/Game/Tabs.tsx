// External

import React from 'react';
import { useDispatch } from 'react-redux';

// Internal

import Chat from '../Lobby/Chat';
// eslint-disable-next-line no-unused-vars
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
  code: string;
  players: string[];
  stage: string | undefined;
  clients: string[];
  highlighted: boolean[];
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
    const highlighted = props.highlighted ? 'highlighted' : '';
    const selected = this.state.tab === props.no;

    const setTab = () => {
      this.setState({ tab: props.no });
      if (props.no < 2) this.props.onClick(props.no, false);
    };

    return (
      <button className={`tag ${highlighted} ${selected}`} onClick={setTab}>
        <p>{props.text}</p>
      </button>
    );
  }

  render() {
    const { game, code, players, clients, highlighted } = this.props;
    const { tab } = this.state;
    const { Tab } = this;

    const routes = [
      <Chat
        players={[]}
        stage="NONE"
        username=""
        chatHighlights={{}}
        key="General Chat"
      />,
      <Chat
        code={game.gameId}
        stage={game.active ? 'NONE' : 'REPLAY'}
        username=""
        players={players}
        chatHighlights={{}}
        key="Game Chat"
      />,
      <Notes notes="" dispatch={useDispatch} key="Notes" />,
      <VoteHistory game={game} key="VH" />,
      <PlayerList code={code} key="Player List" players={players} clients={clients} />,
    ];

    return (
      <div id="Tabs" className="tab">
        <div className="tab-row">
          <Tab text="ALL CHAT" no={0} highlighted={highlighted[0]} />
          <Tab text="GAME CHAT" no={1} highlighted={highlighted[1]} />
          <Tab text="NOTES" no={2} highlighted={false} />
          <Tab text="VOTES" no={3} highlighted={false} />
          <Tab text="PLAYERS" no={4} highlighted={false} />
        </div>
        {routes[tab]}
      </div>
    );
  }
}

export default Tabs;
