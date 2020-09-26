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
  no: string;
  results: (boolean | undefined)[];
  avatars: string[];
  host: string;
  mode: string;
  spectators: number;
  gameState: -1 | 0 | 1 | 2 | 3 | 4;
}

interface GameListState {
  games: GameLinkProps[];
  showCreate: boolean;
}

// Declaration

const Avatar = (props: AvatarProps) => {
  return <div className="avatar" style={{ backgroundImage: 'url(' + props.url + ')' }} />;
};

class GameLink extends React.PureComponent<GameLinkProps> {
  gameStateClass = ['waiting', 'in-progress', 'finished', 'paused', 'frozen'];
  gameState = ['Waiting', 'In Progress', 'Finished', 'Paused', 'Frozen'];

  render() {
    return (
      <Link className="game" to={'/game/' + this.props.no}>
        <h3>
          <p>ROOM {'#' + this.props.no}</p>
          {this.props.gameState > -1 ? (
            <p className={this.gameStateClass[this.props.gameState]}>{this.gameState[this.props.gameState]}</p>
          ) : null}
        </h3>
        <p className="tracker">
          {this.props.results.map((r, i) => (
            <span key={i} className={'mission ' + r} />
          ))}
        </p>
        <p>
          <span className="title">HOST:</span>
          {this.props.host}
        </p>
        <p>
          <span className="title">MODE:</span>
          {this.props.mode}
        </p>
        <p>
          <span className="title">SPECTATORS:</span>
          {this.props.spectators}
        </p>
        <div className="avatars">
          {this.props.avatars.map((r, i) => (
            <Avatar key={i} url={r} />
          ))}
        </div>
      </Link>
    );
  }
}

// Class

class GameList extends React.PureComponent<{}, GameListState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      games: [],
      showCreate: false,
    };
    this.roomListJoin = this.roomListJoin.bind(this);
    this.triggerRequest = this.triggerRequest.bind(this);
    this.parseRoomList = this.parseRoomList.bind(this);
  }

  componentDidMount() {
    socket.on('roomListUpdate', this.triggerRequest);
    socket.on('roomListResponse', this.parseRoomList);

    socket.on('roomListJoinBack', this.roomListJoin);

    this.roomListJoin();
  }

  componentWillUnmount() {
    socket.off('roomListUpdate', this.triggerRequest);
    socket.off('roomListResponse', this.parseRoomList);

    socket.emit('roomListLeave');
  }

  roomListJoin() {
    socket.emit('roomListJoin');
  }

  triggerRequest() {
    socket.emit('roomListRequest');
  }

  parseRoomList(games: GameLinkProps[]) {
    this.setState({ games });
  }

  render() {
    return (
      <div id="Game-List" className="row">
        <h3>
          <p>CURRENT GAMES</p>
        </h3>
        <div className="game-list-settings">
          <button className="game-list-create" onClick={() => this.setState({ showCreate: !this.state.showCreate })}>
            CREATE
          </button>
        </div>
        <AvalonScrollbars>
          {this.state.games.map((g) => <GameLink {...g} key={'Game' + g.no} />).reverse()}
        </AvalonScrollbars>
        {this.state.showCreate ? (
          <GameForm title="CREATE A NEW GAME" onExit={() => this.setState({ showCreate: false })} createsGame={true} />
        ) : null}
      </div>
    );
  }
}

export default GameList;
