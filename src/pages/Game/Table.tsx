// Import External Components

import React, { Component, createRef, RefObject } from 'react';
import { Redirect } from 'react-router-dom';

// Import Internal Components

import StatusBar from './StatusBar';
import GameState from './GameState';
import AvatarUI from './AvatarUI';
import Button from '../../components/utils/Button';

// Import Styles

import '../../styles/Game/Table.scss';

// Class Definition

interface AvatarUIProps {
  spyUrl: string;
  resUrl: string;
  username: string;
  onMission: boolean;
  leader: boolean;
  isRes: boolean;
  isPickable: boolean;
  role: string;
  vote: number;
  table: Table;
}

interface TableProps {
  game: GameState;
}

class MissionTracker extends Component<{ count: number; results: boolean[]; round: number }, {}> {
  render() {
    const playerMatrix = [
      ['2', '3', '2', '3', '3'],
      ['2', '3', '4', '3', '4'],
      ['2', '3', '3', '4*', '4'],
      ['3', '4', '4', '5*', '5'],
      ['3', '4', '4', '5*', '5'],
      ['3', '4', '4', '5*', '5'],
    ];

    const results: (boolean | undefined)[] = [
      this.props.results[0],
      this.props.results[1],
      this.props.results[2],
      this.props.results[3],
      this.props.results[4],
    ];

    const rounds: boolean[] = new Array(5).fill(false).fill(true, 0, this.props.round + 1);

    return (
      <div className="mission-tracker">
        <div className="mission-container">
          {results.map((r, i) => (
            <div className={'mission ' + r} key={'mission' + i}>
              <p>{playerMatrix[this.props.count][i]}</p>{' '}
            </div>
          ))}
        </div>
        <div className="rounds-container">
          {rounds.map((r, i) => (
            <div className={'round ' + r} key={'round' + i} />
          ))}
        </div>
      </div>
    );
  }
}

class Table extends Component<
  TableProps,
  {
    left: AvatarUIProps[];
    right: AvatarUIProps[];
    top: AvatarUIProps[];
    bot: AvatarUIProps[];
    width: number;
    redirect: boolean;
    selected: number[];
  }
> {
  tableRef = createRef<HTMLDivElement>();
  centerRef = createRef<HTMLDivElement>();
  seatRef: RefObject<HTMLDivElement>[] = [];
  avatarRef: RefObject<AvatarUI>[] = [];
  allTimeouts: ReturnType<typeof setTimeout>[] = [];

  constructor(props: TableProps) {
    super(props);
    this.state = {
      left: [],
      right: [],
      top: [],
      bot: [],
      width: 0,
      redirect: false,
      selected: [],
    };
    this.createSeats = this.createSeats.bind(this);
    this.countSelected = this.countSelected.bind(this);
    this.resizeTable = this.resizeTable.bind(this);
    this.initAvatars = this.initAvatars.bind(this);
    this.moveAvatars = this.moveAvatars.bind(this);
    this.moveShields = this.moveShields.bind(this);
    this.leaveLobby = this.leaveLobby.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.resizeTable);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeTable);
    this.allTimeouts.forEach((t) => clearTimeout(t));

    this.leaveLobby();
  }

  componentDidUpdate(prevProps: TableProps) {
    if (prevProps !== this.props) {
      let callback: (...args: any[]) => void = () => {};

      if (
        prevProps.game.players.length !== this.props.game.players.length ||
        prevProps.game.started !== this.props.game.started
      )
        callback = this.resizeTable;
      if (prevProps.game.picks.includes(-1) && !this.props.game.picks.includes(-1)) callback = this.moveShields;

      this.createSeats(callback);
    }
  }

  createSeats(callback: (...args: any[]) => void) {
    const game = this.props.game;

    const left: AvatarUIProps[] = [];
    const top: AvatarUIProps[] = [];
    const right: AvatarUIProps[] = [];
    const bot: AvatarUIProps[] = [];

    this.seatRef = [];
    this.avatarRef = [];

    const players = [...game.players];

    for (let i = 0; i < players.length; i++) {
      this.seatRef[i] = createRef<HTMLDivElement>();
      this.avatarRef[i] = createRef<AvatarUI>();

      const res = ['Resistance?', 'Resistance', 'Percival', 'Merlin', 'Merlin?'];
      const knowledge =
        game.privateKnowledge.length > 0 && game.ended !== true
          ? [...game.privateKnowledge]
          : [...game.publicKnowledge];

      // Pre Conditions
      const imKilling = game.assassin && game.stage === 'ASSASSINATION';
      const imPicking = game.seat === game.leader && game.stage === 'PICKING';
      const imCarding = game.seat === game.card && game.stage === 'CARDING';
      const imVoting = game.stage === 'VOTING';

      // Avatars
      const spyUrl = 'https://cdn.discordapp.com/attachments/612734001916018707/736446594936733786/base-spy.png';
      const resUrl = 'https://cdn.discordapp.com/attachments/688596182758326313/732067339746541628/base-res.png';

      // Data
      const username = players[i];
      const role = knowledge[i];
      const vote = imVoting ? -1 : game.votesRound[i];
      const leader = game.leader === i || (game.started === false && i === 0);
      const isRes = res.includes(knowledge[i]);
      const isPickable = imPicking || imKilling || imCarding;
      const onMission = game.picks.includes(i);

      const e: AvatarUIProps = {
        spyUrl,
        resUrl,
        username,
        role,
        vote,
        leader,
        isRes,
        isPickable,
        onMission,
        table: this,
      };

      const l = Math.floor(players.length / 2);
      if (players.length < 4) {
        switch (i) {
          case 0:
            top.push(e);
            break;
          default:
            bot.push(e);
            break;
        }
      } else {
        switch (i) {
          case 0:
            left.push(e);
            break;
          case l:
            right.push(e);
            break;
          default:
            i < l ? top.push(e) : bot.push(e);
            break;
        }
      }
    }

    this.setState(
      {
        left,
        top,
        right,
        bot,
      },
      callback
    );
  }

  countSelected() {
    const selected: number[] = [];

    this.avatarRef.forEach((avatar, i) => {
      const a = avatar.current!;
      if (a.state.picked) selected.push(i);
    });

    this.setState({ selected });
  }

  resizeTable() {
    const rect = this.tableRef.current!.getBoundingClientRect();

    this.setState({ width: Math.min(rect.height * 4.5, rect.width) }, this.initAvatars);
  }

  initAvatars() {
    this.allTimeouts.forEach((t) => clearTimeout(t));

    this.moveAvatars();
    this.allTimeouts.push(setTimeout(this.moveShields, 550));
  }

  moveAvatars() {
    this.avatarRef.forEach((avatar, i) => {
      const a = avatar.current!;
      const rect_b = this.seatRef[i].current!.getBoundingClientRect();
      a.setState({
        width: this.state.width,
        avatarShow: false,
        avatarInitialPosition: [rect_b.height / 2, rect_b.width / 2],
      });
    });

    const start = 50;

    this.allTimeouts.push(
      setTimeout(
        () =>
          this.avatarRef.forEach((avatar, i) => {
            const a = avatar.current!;
            const rect_a = this.centerRef.current!.getBoundingClientRect();
            const rect_b = this.seatRef[i].current!.getBoundingClientRect();
            a.setState({
              avatarShow: true,
              avatarPosition: [rect_a.top - rect_b.top, rect_a.left - rect_b.left],
            });
          }),
        10
      ),
      setTimeout(
        () =>
          this.avatarRef.forEach((avatar, i) => {
            const a = avatar.current!;
            a.setState({
              avatarPosition: a.state.avatarInitialPosition,
            });
          }),
        start
      )
    );
  }

  moveShields() {
    this.avatarRef.forEach((avatar, i) => {
      const a = avatar.current!;
      if (!a.props.onMission) return;
      a.setState({
        shieldShow: false,
      });
    });

    const start = 200;

    this.allTimeouts.push(
      setTimeout(
        () =>
          this.avatarRef.forEach((avatar, i) => {
            const a = avatar.current!;
            if (!a.props.onMission) return;
            const rect_a = this.centerRef.current!.getBoundingClientRect();
            const rect_b = a.shieldLocation.current!.getBoundingClientRect();
            a.setState({
              shieldShow: true,
              shieldPosition: [rect_a.top - rect_b.top, rect_a.left - rect_b.left],
            });
          }),
        10
      ),
      setTimeout(
        () =>
          this.avatarRef.forEach((avatar, i) => {
            const a = avatar.current!;
            if (!a.props.onMission) return;
            a.setState({
              shieldPosition: [0, 0],
            });
          }),
        start
      ),
      setTimeout(
        () =>
          this.avatarRef.forEach((avatar, i) => {
            const a = avatar.current!;
            if (!a.props.onMission) return;
            a.setState({
              shieldScale: 1.2,
            });
          }),
        start + 700
      ),
      setTimeout(
        () =>
          this.avatarRef.forEach((avatar, i) => {
            const a = avatar.current!;
            if (!a.props.onMission) return;
            a.setState({
              shieldScale: 1,
            });
          }),
        start + 950
      )
    );
  }

  leaveLobby() {
    return false;
  }

  render() {
    const game = this.props.game;
    const topO = this.state.left.length;
    const rightO = this.state.top.length + topO;
    const botO = this.state.right.length + rightO;

    const renderAvatar = (avatar: AvatarUIProps, i: number, origin: number) => (
      <div className="table-seat" ref={this.seatRef[i + origin]} key={'Seat' + i}>
        <AvatarUI {...avatar} ref={this.avatarRef[i + origin]} />
      </div>
    );

    return (
      <div id="Table" className="tab">
        <div className="table-row table-buttons">
          {this.state.redirect ? <Redirect to="/lobby" /> : null}
          <Button
            type="button"
            text="Exit"
            onClick={() => {
              this.setState({
                redirect: true,
              });
            }}
            className=""
          />
          <Button type="button" text="Claim" onClick={undefined} className="" />
        </div>
        <div className="table-row table-display" ref={this.tableRef} style={{ width: '95%' }}>
          <div className="table-column">
            <div className="table-prow">{this.state.left.map((a, i) => renderAvatar(a, i, 0))}</div>
          </div>
          <div className="table-column">
            <div className="table-prow">{this.state.top.map((a, i) => renderAvatar(a, i, topO))}</div>
            <div className="table-prow">
              <div className="table-center" ref={this.centerRef}>
                {game.started ? (
                  <MissionTracker
                    count={Math.max(game.players.length - 5, 0)}
                    results={game.results}
                    round={game.round}
                  />
                ) : null}
              </div>
            </div>
            <div className="table-prow">{this.state.bot.map((a, i) => renderAvatar(a, i, botO)).reverse()}</div>
          </div>
          <div className="table-column">
            <div className="table-prow">{this.state.right.map((a, i) => renderAvatar(a, i, rightO))}</div>
          </div>
        </div>
        <div className="table-row table-info">
          <StatusBar {...game} selected={this.state.selected} />
        </div>
      </div>
    );
  }
}

export default Table;
