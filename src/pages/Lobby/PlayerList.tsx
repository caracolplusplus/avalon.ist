// External

import React from 'react';
import { Link } from 'react-router-dom';

// Internal

import Parse from '../../parse/parse';
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
  allPlayers: PlayerProps[];
  loaded: boolean;
}

const Player = (props: PlayerProps) => {
  let tag: any = null;

  if (props.isAdmin) {
    tag = <span className="playerTag admin">A</span>;
  } else if (props.isMod) {
    tag = <span className="playerTag mod">M</span>;
  } else if (props.isContrib) {
    tag = <span className="playerTag contrib">C</span>;
  }

  return (
    <p className="player">
      <Link className="player-name" to={'/profile/' + props.username}>
        {tag}
        {props.username}
      </Link>
    </p>
  );
};

class PlayerTab extends React.PureComponent<PlayerTabProps, PlayerTabState> {
  state = {
    showTab: true,
  };

  toggleTab = () => {
    this.setState({ showTab: !this.state.showTab });
  };

  render() {
    const { showTab } = this.state;
    const { title, players } = this.props;

    return (
      <div className="the-whole-tab">
        <p className="tab-title" onClick={this.toggleTab}>
          <button>
            <i className={showTab ? 'arrow up' : 'arrow down'} />
          </button>
          <span>
            {title}({players.length})
          </span>
        </p>
        {showTab ? (
          <div className="player-tab">
            {players.map((p, i) => (
              <Player {...p} key={'Player' + i} />
            ))}
          </div>
        ) : null}
      </div>
    );
  }
}

class PlayerList extends React.PureComponent<PlayerListProps, PlayerListState> {
  state = {
    areAdmins: [],
    areContribs: [],
    arePlayers: [],
    allPlayers: [],
    loaded: false,
  };
  listSub: any = null;

  componentDidMount = () => {
    this.setSubscription();
  };

  componentWillUnmount = () => {
    this.listSub.unsubscribe();
  };

  setSubscription = async () => {
    const listQ = new Parse.Query('Lists');

    this.listSub = await listQ.subscribe();

    this.listSub.on('open', this.playerListRequest);
    this.listSub.on('update', this.playerListRequest);
  };

  playerListRequest = () => {
    Parse.Cloud.run('playerListRequest').then((result) =>
      this.playerListResponse(result)
    );
  };

  playerListResponse = (players: PlayerProps[]) => {
    function compareRatings(a: PlayerProps, b: PlayerProps) {
      return b.rating - a.rating;
    }

    players = players.sort(compareRatings);

    const areAdmins = players.filter((p) => p.isAdmin || p.isMod);
    const areContribs = players.filter((p) => !p.isAdmin && !p.isMod && p.isContrib);
    const arePlayers = players.filter((p) => !p.isAdmin && !p.isMod && !p.isContrib);

    function sortAdmins(a: PlayerProps, b: PlayerProps) {
      return a.isAdmin ? -1 : 1;
    }

    areAdmins.sort(sortAdmins);

    this.setState({
      areAdmins,
      areContribs,
      arePlayers,
      allPlayers: players,
      loaded: true,
    });
  };

  render() {
    const { clients, players } = this.props;

    const { code } = this.props;
    const {
      loaded,
      allPlayers,
      areAdmins,
      areContribs,
      arePlayers,
    }: PlayerListState = this.state;

    const arePlaying = allPlayers.filter(
      (p) => clients.includes(p.username) && players.includes(p.username)
    );
    const areSpectating = allPlayers.filter(
      (p) => clients.includes(p.username) && !players.includes(p.username)
    );

    return (
      <div id="Player-List" className="row">
        <h3>
          <p>PLAYER LIST</p>
        </h3>
        {loaded && (code || code !== '-1') ? (
          <AvalonScrollbars>
            {code !== undefined ? (
              <>
                <PlayerTab title="In Game" players={arePlaying} />
                <PlayerTab title="Spectating" players={areSpectating} />
              </>
            ) : null}
            <PlayerTab title="Moderators" players={areAdmins} />
            <PlayerTab title="Contributors" players={areContribs} />
            <PlayerTab title="Players" players={arePlayers} />
          </AvalonScrollbars>
        ) : null}
      </div>
    );
  }
}

export default PlayerList;
