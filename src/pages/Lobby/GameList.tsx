// External

import React from 'react';
import { Link } from 'react-router-dom';

// Internal

import socket from '../../socket-io/socket-io';
import AvalonScrollbars from '../../components/utils/AvalonScrollbars';

import GameForm from './GameForm';

// Styles

import '../../styles/Lobby/GameList.scss';

// Types

interface AvatarProps {
  url: string;
}

interface GameLinkProps {
  gameId: string;
  code: string;
  missionResults: (boolean | undefined)[];
  avatars: string[];
  host: string;
  mode: string;
  spectators: number;
  state: -1 | 0 | 1 | 2 | 3 | 4;
}

interface GameListState {
  games: GameLinkProps[];
  showCreate: boolean;
}

// Declaration

const Avatar = (props: AvatarProps) => {
  return <div className="avatar" style={{ backgroundImage: `url(${props.url})` }} />;
};

class GameLink extends React.PureComponent<GameLinkProps> {
  gameStateClass = ['waiting', 'in-progress', 'finished', 'paused', 'frozen'];
  gameState = ['Waiting', 'In Progress', 'Finished', 'Paused', 'Frozen'];

  render() {
    const { gameId, code, state, host, mode, spectators, missionResults, avatars } = this.props;
    const _missionResults: (boolean | undefined)[] = new Array(5);
    _missionResults.fill(undefined);
    _missionResults.unshift(...missionResults);

    return (
      <Link className="game" to={`/game/${code}`}>
        <h3>
          <p>ROOM #{code}</p>
          {state > -1 ? (
            <p className={this.gameStateClass[state]}>{this.gameState[state]}</p>
          ) : null}
        </h3>
        <p className="tracker">
          {_missionResults.slice(0, 5).map((r, i) => (
            <span key={i} className={'mission ' + r} />
          ))}
        </p>
        <p>
          <span className="title">HOST:</span>
          {host}
        </p>
        <p>
          <span className="title">MODE:</span>
          {mode}
        </p>
        <p>
          <span className="title">SPECTATORS:</span>
          {spectators}
        </p>
        <div className="avatars">
          {avatars.map((r, i) => (
            <Avatar key={i} url={r} />
          ))}
        </div>
      </Link>
    );
  }
}

// Class

class GameList extends React.PureComponent<{}, GameListState> {
  state = {
    games: [],
    showCreate: false,
  };

  componentDidMount = () => {
    socket.on('roomListResponse', this.parseRoomList);

    socket.emit('roomListRequest');
  };

  componentWillUnmount = () => {
    socket.off('roomListResponse', this.parseRoomList);
  };

  parseRoomList = (games: GameLinkProps[]) => {
    this.setState({ games });
  };

  showCreateForm = () => {
    const { showCreate } = this.state;

    this.setState({ showCreate: !showCreate });
  };

  exitCreateForm = () => {
    this.setState({ showCreate: false });
  };

  render() {
    const { games, showCreate }: GameListState = this.state;
    return (
      <div id="Game-List" className="row">
        <h3>
          <p>CURRENT GAMES</p>
        </h3>
        <div className="game-list-settings">
          <button className="game-list-create" onClick={this.showCreateForm}>
            CREATE
          </button>
        </div>
        <AvalonScrollbars>
          {games.map((g) => <GameLink {...g} key={'Game' + g.code} />).reverse()}
        </AvalonScrollbars>
        {showCreate ? (
          <GameForm
            title="CREATE A NEW GAME"
            onExit={this.exitCreateForm}
            createsGame={true}
          />
        ) : null}
      </div>
    );
  }
}

export default GameList;
