// External

import React, { createRef } from 'react';
import { Redirect } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import { useDispatch, connect } from 'react-redux';
import { rootType } from '../redux/reducers';

// Internal

import socket from '../socket-io/socket-io';
import AvalonScrollbars from '../components/utils/AvalonScrollbars';

import Navbar from './Navbar';
import Tabs from './Game/Tabs';
import Table from './Game/Table';
import GameState from './Game/GameState';

// Styles

import '../styles/Game.scss';

// Declaration

interface GameProps {
  id: string;
}

interface PageProps extends RouteComponentProps<GameProps> {
  style?: any;
}

const mapState = (state: rootType) => {
  const { style } = state;
  return { style };
};

class Game extends React.PureComponent<PageProps, GameState> {
  initialHeight = Math.max(window.innerHeight, 540);
  tableRef = createRef<Table>();
  tabsRef = [createRef<Tabs>(), createRef<Tabs>(), createRef<Tabs>()];

  constructor(props: PageProps) {
    super(props);
    this.state = {
      // Player Info
      seat: -1,
      username: 'NONAME',
      // Players In Table
      players: [],
      clients: [],
      avatars: [],
      imRes: false,
      // Game State Info
      started: undefined,
      ended: undefined,
      frozen: undefined,
      stage: undefined,
      cause: undefined,
      assassination: -1,
      // Game UI Info
      style: props.style,
      highlighted: [false, false],
      notFound: false,
      // Game Pick Info
      picks: [],
      picksYetToVote: [],
      votesRound: [],
      // Game Knowledge
      publicKnowledge: [],
      privateKnowledge: [],
      // Game Power Positions
      leader: -1,
      hammer: -1,
      card: -1,
      assassin: false,
      // Game Mission Info
      mission: -1,
      round: -1,
      // Past Game Info
      results: [],
      cardHolders: [],
      missionVotes: [[], [], [], [], []],
      missionTeams: [[], [], [], [], []],
      missionLeader: [],
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
        card: false,
      },
    };
    this.gameNotFound = this.gameNotFound.bind(this);
    this.joinRoom = this.joinRoom.bind(this);
    this.triggerRequest = this.triggerRequest.bind(this);
    this.parseGame = this.parseGame.bind(this);
  }

  componentDidMount() {
    socket.on('generalChatUpdate', this.setHighlightGeneral);
    socket.on('gameChatUpdate', this.setHighlightGame);
    socket.on('gameUpdate', this.triggerRequest);
    socket.on('gameResponse', this.parseGame);
    socket.on('gameNotFound', this.gameNotFound);

    socket.on('roomJoinBack', this.joinRoom);

    this.joinRoom();
  }

  componentWillUnmount() {
    socket.off('generalChatUpdate', this.setHighlightGeneral);
    socket.off('gameChatUpdate', this.setHighlightGame);
    socket.off('gameUpdate', this.triggerRequest);
    socket.off('gameResponse', this.parseGame);
    socket.off('gameNotFound', this.gameNotFound);

    socket.off('roomJoinBack', this.joinRoom);

    if (this.state.stage !== 'REPLAY' || this.state.code !== '-1') socket.emit('roomLeave');
  }

  componentDidUpdate(prevProps: PageProps) {
    if (prevProps.style !== this.props.style) {
      this.setState({ ...this.state, style: this.props.style});
    }
  }

  joinRoom() {
    socket.emit('roomJoin', this.props.match.params.id);
  }

  gameNotFound() {
    this.setState({ notFound: true });
  }

  setHighlightGeneral = () => this.setHighlight(0, true);

  setHighlightGame = () => this.setHighlight(1, true);

  setHighlight = (no: number, value: boolean) => {
    const tabsSelected = this.tabsRef.map((r) => (r.current ? r.current.state.tab : -1));
    if (tabsSelected.includes(no)) value = false;

    const highlighted = [...this.state.highlighted];
    highlighted[no] = value;

    this.setState({ highlighted });
  };

  triggerRequest() {
    socket.emit('gameRequest');
  }

  parseGame(data: GameState) {
    data.style = this.props.style;
    data.highlighted = this.state.highlighted;
    data.notFound = this.state.notFound;

    this.setState(data);
  }

  render() {
    const tabs = [];
    const initialTabArray = [1, 3, 2];

    const theme = this.props.style.themeLight ? 'light' : 'dark';

    for (let i = 0; i < this.props.style.playTabs; i++) {
      tabs.push(
        <Tabs
          key={'Tab' + i}
          ref={this.tabsRef[i]}
          game={this.state}
          initialTab={initialTabArray[i]}
          onClick={this.setHighlight}
        />
      );
    }

    return this.state.notFound ? (
      <Redirect to="/game-not-found" />
    ) : (
      <div id="Background-2" className={'full ' + theme}>
        <Navbar username="" key={'Navbar'}/>
        <AvalonScrollbars>
          <div id="Game" style={{ minHeight: this.initialHeight + 'px' }} className="section">
            <div className="column section" style={{ flex: '0 0 ' + (40 + this.props.style.playArea * 20) + '%' }}>
              <Table
                ref={this.tableRef}
                game={this.state}
                dispatch={useDispatch}
              />
            </div>
            <div className="column section">{tabs}</div>
          </div>
        </AvalonScrollbars>
      </div>
    );
  }
}

export default connect(mapState, null)(Game);
