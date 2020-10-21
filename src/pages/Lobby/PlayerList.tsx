// External

import React from 'react';
import { Link } from 'react-router-dom';

// Internal

import socket from '../../socket-io/socket-io';
import AvalonScrollbars from '../../components/utils/AvalonScrollbars';

// Styles

import '../../styles/Lobby/PlayerList.scss';

// Declaration

interface PlayerProps {
  username: string;
  rating: number;
  isAdmin: boolean;
  isMod: boolean;
  isContrib: boolean;
}

interface PlayerTabProps {
  players: PlayerProps[];
  title: string;
}

interface PlayerTabState {
  showTab: boolean;
}

interface PlayerListProps {
  code?: string;
  players: string[];
  clients: string[];
}

interface PlayerListState {
  areAdmins: PlayerProps[];
  areContribs: PlayerProps[];
  arePlayers: PlayerProps[];
  arePlaying: PlayerProps[];
  areSpectating: PlayerProps[];
  loaded: boolean;
}

const Player = (props: PlayerProps) => {
  return (
    <p className="player">
      <Link className="player-name" to={'/profile/' + props.username}>
        {props.username}
      </Link>
    </p>
  );
};

class PlayerTab extends React.PureComponent<PlayerTabProps, PlayerTabState> {
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
        <p className="tab-title" onClick={this.toggleTab}>
          <button>
            <i className={this.state.showTab ? 'arrow up' : 'arrow down'} />
          </button>
          <span>
            {this.props.title}({this.props.players.length})
          </span>
        </p>
        {this.state.showTab ? (
          <div className="player-tab">
            {this.props.players.map((p, i) => (
              <Player {...p} key={'Player' + i} />
            ))}
          </div>
        ) : null}
      </div>
    );
  }
}

class PlayerList extends React.PureComponent<PlayerListProps, PlayerListState> {
  constructor(props: PlayerListProps) {
    super(props);
    this.state = {
      areAdmins: [],
      areContribs: [],
      arePlayers: [],
      arePlaying: [],
      areSpectating: [],
      loaded: false,
    };
    this.parseClientsOnline = this.parseClientsOnline.bind(this);
  }

  componentDidMount() {
    socket.on('clientsOnlineResponse', this.parseClientsOnline);

    socket.emit('clientsOnlineRequest');
  }

  componentWillUnmount() {
    socket.off('clientsOnlineResponse', this.parseClientsOnline);
  }

  componentDidUpdate(prevProps: PlayerListProps) {
    const arraysEqual = (a: string[], b: string[]) => {
      if (a === b) return true;
      if (a == null || b == null) return false;
      if (a.length !== b.length) return false;

      // If you don't care about the order of the elements inside
      // the array, you should sort both arrays here.
      // Please note that calling sort on an array will modify that array.
      // you might want to clone your array first.

      for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    };

    if (!arraysEqual(this.props.players, prevProps.players) || !arraysEqual(this.props.clients, prevProps.clients)) {
      socket.emit('clientsOnlineRequest');
    }
  }

  parseClientsOnline(clients: PlayerProps[]) {
    const areAdmins: PlayerProps[] = [];
    const areContribs: PlayerProps[] = [];
    const arePlayers: PlayerProps[] = [];

    const arePlaying: PlayerProps[] = [];
    const areSpectating: PlayerProps[] = [];

    clients.forEach((c) => {
      if (c.isAdmin || c.isMod) {
        areAdmins.push(c);
      } else if (c.isContrib) {
        areContribs.push(c);
      } else {
        arePlayers.push(c);
      }

      const name = c.username;

      if (this.props.code !== undefined && this.props.clients.includes(name)) {
        if (this.props.players.includes(name)) {
          arePlaying.push(c);
        } else {
          areSpectating.push(c);
        }
      }
    });

    function compareRatings(a: PlayerProps, b: PlayerProps) {
      return b.rating - a.rating;
    }

    areAdmins.sort(compareRatings);
    areContribs.sort(compareRatings);
    arePlayers.sort(compareRatings);

    arePlaying.sort(compareRatings);
    areSpectating.sort(compareRatings);

    this.setState({
      areAdmins,
      areContribs,
      arePlayers,
      arePlaying,
      areSpectating,
      loaded: true,
    });
  }

  render() {
    return (
      <div id="Player-List" className="row">
        <h3>
          <p>PLAYER LIST</p>
        </h3>
        {this.state.loaded && (this.props.code === undefined || this.props.code !== '-1') ? (
          <AvalonScrollbars>
            {this.props.code !== undefined ? (
              <>
                <PlayerTab title="In Game" players={this.state.arePlaying} />
                <PlayerTab title="Spectating" players={this.state.areSpectating} />
              </>
            ) : null}
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
