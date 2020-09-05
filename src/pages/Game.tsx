// External

import React, { Component, createRef } from 'react';
import { RouteComponentProps } from 'react-router';

// Internal

// import GameForm from './Lobby/GameForm'

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
  resizeCount = 1;
  tableRef = createRef<Table>();

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
      // Game Pick Info
      picks: [],
      votesRound: [],
      voted: [],
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
    this.joinRoom = this.joinRoom.bind(this);
    this.triggerRequest = this.triggerRequest.bind(this);
    this.parseGame = this.parseGame.bind(this);
    this.setTableHeight = this.setTableHeight.bind(this);
  }

  componentDidMount() {
    socket.on('gameUpdate', this.triggerRequest);
    socket.on('gameResponse', this.parseGame);

    socket.on('rejoinGame', this.joinRoom);

    this.joinRoom();
  }

  joinRoom() {
    socket.emit('roomJoin', {
      roomNumber: this.props.match.params.id,
    });
  }

  componentWillUnmount() {
    socket.off('gameUpdate', this.triggerRequest);
    socket.off('gameResponse', this.parseGame);

    socket.emit('roomLeave', {
      roomNumber: this.props.match.params.id,
    });
  }

  triggerRequest() {
    socket.emit('gameRequest', {
      roomNumber: this.props.match.params.id,
    });
  }

  parseGame(data: GameState) {
    data.tabs = this.state.tabs;
    data.scale = this.state.scale;

    this.setState(data, () => {
      if (this.resizeCount) this.tableRef.current!.resizeTable();
      this.resizeCount = 0;
    });
  }

  setTableHeight() {
    this.setState({
      scale: (this.state.scale + 0.1) % 1.1,
    });

    this.tableRef.current!.resizeTable();
  }

  render() {
    const tabs = [];
    const initialTabArray = [1, 3, 2];

    for (let i = 0; i < this.state.tabs; i++) {
      tabs.push(<Tabs key={'Tab' + i} game={this.state} initialTab={initialTabArray[i]}/>);
    }

    return (
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
