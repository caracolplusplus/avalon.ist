// External

import React, { createRef } from 'react';
import { Redirect } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { RouteComponentProps } from 'react-router';
import { connect } from 'react-redux';
// eslint-disable-next-line no-unused-vars
import { rootType } from '../redux/reducers';

// Internal

import socket from '../socket-io/socket-io';
import AvalonScrollbars from '../components/utils/AvalonScrollbars';

import Navbar from './Navbar';
import Tabs from './Game/Tabs';
// eslint-disable-next-line no-unused-vars
import ConnectedTable, { Table } from './Game/Table';
// eslint-disable-next-line no-unused-vars
import GameState from './Game/GameState';

// Styles

import '../styles/Game.scss';

// Declaration

interface GameProps {
  gameId: string;
  code: string;
}

interface PageProps extends RouteComponentProps<GameProps> {
  style?: any;
  username: string;
}

const mapState = (state: rootType) => {
  const { style, username } = state;

  return { style, username };
};

const resRoles = ['Merlin', 'Percival', 'Resistance'];

class Game extends React.PureComponent<PageProps, GameState> {
  state = {
    seat: -1,
    username: 'Anonymous',
    // Players In Table
    players: [],
    clients: [],
    avatars: [],
    claimed: [],
    kicked: false,
    imRes: false,
    // Game State Info
    active: true,
    started: undefined,
    ended: undefined,
    frozen: undefined,
    stage: undefined,
    cause: undefined,
    askedToBeReady: false,
    assassination: -1,
    // Game UI Info
    style: {},
    highlighted: [false, false],
    notFound: false,
    // Game Pick Info
    picks: [],
    picksYetToVote: [],
    votesRound: [],
    votesPending: [],
    // Game Knowledge
    publicKnowledge: [],
    privateKnowledge: [],
    // Game Power Positions
    leader: -1,
    hammer: -1,
    card: -1,
    assassin: false,
    assassinName: 'Anonymous',
    // Game Mission Info
    mission: -1,
    round: -1,
    // Past Game Info
    results: [],
    cardHolders: [],
    missionVotes: [[], [], [], [], []],
    missionTeams: [[], [], [], [], []],
    missionLeader: [],
    // Game Id
    gameId: '-1',
    // Room Number
    code: '-1',
    // Game Settings
    playerMax: 0,
    roleSettings: {
      merlin: false,
      percival: false,
      morgana: false,
      assassin: false,
      oberon: false,
      mordred: false,
      lady: false,
    },
  };

  initialHeight = Math.max(window.innerHeight, 540);
  tableRef = createRef<Table>();
  tabsRef = [createRef<Tabs>(), createRef<Tabs>(), createRef<Tabs>()];

  componentDidMount = () => {
    const { style, username } = this.props;

    socket.on('generalChatResponse', this.setHighlightGeneral);
    socket.on('gameChatResponse', this.setHighlightGame);
    socket.on('gameResponse', this.parseGame);
    socket.on('gameNotFound', this.gameNotFound);

    socket.on('rejoin', this.triggerRequest);
    this.triggerRequest();

    this.setState({ style, username });
  };

  componentWillUnmount = () => {
    socket.off('generalChatResponse', this.setHighlightGeneral);
    socket.off('gameChatResponse', this.setHighlightGame);
    socket.off('gameResponse', this.parseGame);
    socket.off('gameNotFound', this.gameNotFound);

    socket.off('rejoin', this.triggerRequest);

    const { active, code } = this.state;

    if (active || code !== '-1') socket.emit('gameLeave');
  };

  componentDidUpdate = (prevProps: PageProps) => {
    const { style: prevStyle } = prevProps;
    const { style } = this.props;

    if (prevStyle !== style) {
      this.setState({ style });
    }
  };

  triggerRequest = () => {
    const { gameId } = this.props.match.params;
    socket.emit('gameRequest', gameId);
  };

  gameNotFound = () => {
    this.setState({ notFound: true });
  };

  setHighlightGeneral = () => this.setHighlight(0, true);

  setHighlightGame = () => this.setHighlight(1, true);

  refMapper = (r: any) => (r.current ? r.current.state.tab : -1);

  setHighlight = (no: number, value: boolean) => {
    const { tabsRef } = this;

    const tabsSelected = tabsRef.map(this.refMapper);
    if (tabsSelected.includes(no)) value = false;

    const { highlighted } = this.state;
    highlighted[no] = value;

    this.setState({ highlighted });
  };

  parseGame = (data: any) => {
    // This function parses the game from the server to the client
    // This is done after the socket.io event "gameResponse"

    // Gets the username from props, which is on redux
    const { username } = this.props;

    // Gets these variables from the game
    const { avatarList, playerList, roleList, votesRound: _votesRound } = data;

    // Gets the avatars from the avatar list
    const avatars: any[] = playerList.map((p: any) => avatarList[p.replace(/\./gi, '/')]);

    // Gets the default vote for a not fail
    // Its -1 only on mission 1.1, this is to hide the vote display on first mission
    // Votes round only counts for fails
    const notFailVote = _votesRound.length ? 1 : -1;

    // Turns the round votes into readable data for the avatar component
    const votesRound = playerList.map((p: string) =>
      _votesRound.includes(p) ? 0 : notFailVote
    );

    // Gets the spectator list for the rest of components
    const clients = data.spectatorListNew;

    // Gets the seat of the player and if the game has assassin
    const seat = playerList.indexOf(username);
    const hasAssassin = roleList.indexOf('Assassin');

    // Sets state with the rest of values from the game
    this.setState({
      gameId: data.gameId,
      code: data.code,
      players: playerList,
      kicked: data.kickedPlayers.includes(username),
      claimed: data.hasClaimed,
      avatars,
      clients,
      seat,
      askedToBeReady: data.askedToBeReady,
      imRes: resRoles.includes(roleList[seat]),
      active: data.active,
      started: data.started,
      ended: data.ended,
      frozen: data.frozen,
      stage: data.stage,
      cause: data.cause,
      assassination: data.assassination,
      picks: data.picks,
      picksYetToVote: data.picksYetToVote,
      votesRound,
      votesPending: data.votesPending,
      publicKnowledge: data.publicKnowledge,
      privateKnowledge: data.privateKnowledge[username.replace(/\./gi, '/')] || [],
      leader: data.leader,
      hammer: data.hammer,
      card: data.lady,
      assassin: hasAssassin > -1,
      assassinName: hasAssassin > -1 ? playerList[hasAssassin] : 'Anonymous',
      mission: data.mission,
      round: data.round,
      results: data.missionResults,
      cardHolders: data.ladyHolders,
      missionLeader: data.missionLeader,
      missionVotes: data.missionVotes,
      missionTeams: data.missionPicks,
      playerMax: data.playerMax,
      roleSettings: data.roleSettings,
    });
  };

  render() {
    const tabs = [];
    const initialTabArray = [1, 3, 2];

    const theme = this.props.style.themeLight ? 'light' : 'dark';
    const { style, code, players, stage, clients, highlighted }: GameState = this.state;

    for (let i = 0; i < style.playTabs; i++) {
      tabs.push(
        <Tabs
          key={'Tab' + i}
          ref={this.tabsRef[i]}
          code={code}
          players={players}
          stage={stage}
          clients={clients}
          game={this.state}
          highlighted={highlighted}
          initialTab={initialTabArray[i]}
          onClick={this.setHighlight}
        />
      );
    }

    return this.state.notFound ? (
      <Redirect to="/game-not-found" />
    ) : (
      <div id="Background-2" className={'full ' + theme}>
        <Navbar username="" key={'Navbar'} />
        <AvalonScrollbars>
          <div
            id="Game"
            style={{ minHeight: this.initialHeight + 'px' }}
            className="section"
          >
            <div
              className="column section"
              style={{ flex: '0 0 ' + (40 + this.props.style.playArea * 20) + '%' }}
            >
              <ConnectedTable ref={this.tableRef} game={this.state} />
            </div>
            <div className="column section">{tabs}</div>
          </div>
        </AvalonScrollbars>
      </div>
    );
  }
}

export default connect(mapState, null)(Game);
