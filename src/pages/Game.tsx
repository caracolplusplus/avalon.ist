// External

import React, { createRef } from 'react';
import { Redirect } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';

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

class Game extends React.PureComponent<RouteComponentProps<GameProps>, GameState> {
  initialHeight = Math.max(window.innerHeight, 540);
  tableRef = createRef<Table>();
  tabsRef = [createRef<Tabs>(), createRef<Tabs>(), createRef<Tabs>()];

  constructor(props: RouteComponentProps<GameProps>) {
    super(props);
    this.state = {
      // Player Info
      username: 'Oken',
      players: [],
      clients: [],
      seat: -1,
      imRes: false,
      // Game State Info
      started: undefined,
      ended: undefined,
      frozen: undefined,
      stage: undefined,
      cause: undefined,
      assassination: -1,
      // Game UI Info
      tabs: 2,
      scale: 1,
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
      code: -1,
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
    this.setTableHeight = this.setTableHeight.bind(this);
  }

  componentDidMount() {
    socket.on('generalChatUpdate', () => this.setHighlight(0, true));
    socket.on('gameChatUpdate', () => this.setHighlight(1, true));
    socket.on('gameUpdate', this.triggerRequest);
    socket.on('gameResponse', this.parseGame);
    socket.on('gameNotFound', this.gameNotFound);

    socket.on('roomJoinBack', this.joinRoom);

    this.joinRoom();
  }

  componentWillUnmount() {
    socket.off('generalChatUpdate', () => this.setHighlight(0, true));
    socket.off('gameChatUpdate', () => this.setHighlight(1, true));
    socket.off('gameUpdate', this.triggerRequest);
    socket.off('gameResponse', this.parseGame);
    socket.off('gameNotFound', this.gameNotFound);

    socket.emit('roomLeave');
  }

  joinRoom() {
    socket.emit('roomJoin', this.props.match.params.id);
  }

  gameNotFound() {
    this.setState({ notFound: true });
  }

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
    data.tabs = this.state.tabs;
    data.scale = this.state.scale;
    data.highlighted = this.state.highlighted;
    data.notFound = this.state.notFound;

    this.setState(data);
  }

  setTableHeight() {
    this.setState({
      scale: (this.state.scale + 0.1) % 1.1,
    });

    this.tableRef.current!.initAvatars();
  }

  render() {
    const tabs = [];
    const initialTabArray = [1, 3, 2];

    for (let i = 0; i < this.state.tabs; i++) {
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

    return this.state.notFound ? <Redirect to="/game-not-found" /> : (
      <div id="Background-2" className="dark full">
        <Navbar username="" />
        <AvalonScrollbars>
          <div id="Game" style={{ minHeight: this.initialHeight + 'px' }} className="section">
            <div className="column section" style={{ flex: '0 0 ' + (40 + this.state.scale * 20) + '%' }}>
              <Table ref={this.tableRef} game={this.state} />
            </div>
            <div className="column section">{tabs}</div>
          </div>
        </AvalonScrollbars>
      </div>
    );
  }
}

export default Game;

// <GameForm title="" onExit={() => {}}/>
