// External

import React, { Component, createRef, RefObject } from 'react';
import { Redirect } from 'react-router-dom';

// Internal

import AvatarUIProps from './AvatarUIProps';
import StatusBar from './StatusBar';
import GameState from './GameState';
import AvatarUI from './AvatarUI';
import Button from '../../components/utils/Button';
import AvatarUpdate from 'worker-loader!./AvatarUpdate';

// Import Styles

import '../../styles/Game/Table.scss';

// Class Definition

interface TableProps {
  game: GameState;
}

class MissionTracker extends React.PureComponent<{ count: number; results: boolean[]; round: number }, {}> {
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

class Table extends React.PureComponent<
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
  webWorker: any = null;
  tableRef = createRef<HTMLDivElement>();
  centerRef = createRef<HTMLDivElement>();
  seatRef = new Array(10).fill(createRef<HTMLDivElement>());
  avatarRef = new Array(10).fill(createRef<AvatarUI>());
  animationCallback: (...args: any[]) => void = () => {};
  animationFrame = (
    window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame
  ).bind(window);
  animationFrameCancel = (window.cancelAnimationFrame || window.mozCancelAnimationFrame).bind(window);
  animationStartAvatar: number | null = null;
  animationStartShield: number | null = null;
  animationState: number[] = [];
  allAnimations: any[] = [];

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
    this.initShields = this.initShields.bind(this);
    this.moveAvatars = this.moveAvatars.bind(this);
    this.moveShields = this.moveShields.bind(this);
    this.leaveLobby = this.leaveLobby.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.resizeTable);

    this.webWorker = new Worker('./AvatarUpdate.tsx');

    this.webWorker.addEventListener('message', (event: any) => {
      console.log("hello?");
      const data = event.data;

      this.setState({ left: data.left, right: data.right, top: data.top, bot: data.bot }, this.animationCallback);
    });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeTable);
    if (this.allAnimations[0] !== undefined) {
      this.animationFrameCancel(this.allAnimations[0]);
      this.allAnimations[0] = undefined;
    }
    if (this.allAnimations[1] !== undefined) {
      this.animationFrameCancel(this.allAnimations[1]);
      this.allAnimations[1] = undefined;
    }

    this.leaveLobby();
  }

  componentDidUpdate(prevProps: TableProps) {
    if (prevProps !== this.props) {
      if (
        prevProps.game.players.length !== this.props.game.players.length ||
        prevProps.game.started !== this.props.game.started
      )
        this.animationCallback = this.resizeTable;

      if (prevProps.game.picks.includes(-1) && !this.props.game.picks.includes(-1))
        this.animationCallback = this.initShields;

      this.createSeats();
    }
  }

  createSeats() {
    this.webWorker.postMessage(this.props.game);
  }

  countSelected() {
    const selected: number[] = [];

    this.avatarRef.forEach((avatar, i) => {
      const a = avatar.current!;
      if (!a) return;
      if (a.state.picked) selected.push(i);
    });

    this.setState({ selected });
  }

  resizeTable() {
    const rect = this.tableRef.current!.getBoundingClientRect();

    this.setState({ width: Math.min(rect.height * 4.5, rect.width) }, this.initAvatars);
  }

  initAvatars() {
    if (this.allAnimations[0] !== undefined) {
      this.animationFrameCancel(this.allAnimations[0]);
      this.allAnimations[0] = undefined;
    }
    if (this.allAnimations[1] !== undefined) {
      this.animationFrameCancel(this.allAnimations[1]);
      this.allAnimations[1] = undefined;
    }

    this.animationStartAvatar = null;
    this.animationStartShield = null;
    this.allAnimations[0] = this.animationFrame(this.moveAvatars);
    this.allAnimations[1] = this.animationFrame(this.moveShields);
  }

  initShields() {
    if (this.allAnimations[1] !== undefined) {
      this.animationFrameCancel(this.allAnimations[1]);
      this.allAnimations[1] = undefined;
    }

    this.animationStartShield = null;
    this.allAnimations[1] = this.animationFrame(this.moveShields);
  }

  moveAvatars(animationTime: number) {
    let initAnimation: boolean = false;

    if (!this.animationStartAvatar) {
      this.animationStartAvatar = animationTime;
      this.animationState[0] = 0;
      initAnimation = true;
    }

    const initialFrame = 10;
    const animationProgress = animationTime - this.animationStartAvatar;

    if (initAnimation)
      this.avatarRef.forEach((avatar, i) => {
        const a = avatar.current!;
        if (!a) return;
        const rect_b = this.seatRef[i].current!.getBoundingClientRect();
        a.setState({
          width: this.state.width,
          avatarShow: false,
          avatarInitialPosition: [rect_b.height / 2, rect_b.width / 2],
        });
      });

    if (animationProgress > initialFrame && this.animationState[0] === 0) {
      this.avatarRef.forEach((avatar, i) => {
        const a = avatar.current!;
        if (!a) return;
        const rect_a = this.centerRef.current!.getBoundingClientRect();
        const rect_b = this.seatRef[i].current!.getBoundingClientRect();
        a.setState({
          avatarShow: true,
          avatarPosition: [rect_a.top - rect_b.top, rect_a.left - rect_b.left],
        });
      });

      this.animationState[0]++;
    }

    if (animationProgress > initialFrame + 40) {
      this.avatarRef.forEach((avatar, i) => {
        const a = avatar.current!;
        if (!a) return;
        a.setState({
          avatarPosition: a.state.avatarInitialPosition,
        });
      });
    } else {
      this.allAnimations[0] = this.animationFrame(this.moveAvatars);
    }
  }

  moveShields(animationTime: number) {
    let initAnimation: boolean = false;

    if (!this.animationStartShield) {
      this.animationStartShield = animationTime;
      this.animationState[1] = 0;
      initAnimation = true;
    }
    const initialFrame = 750;
    const animationProgress = animationTime - this.animationStartShield;

    if (initAnimation)
      this.avatarRef.forEach((avatar, i) => {
        const a = avatar.current!;
        if (!a) return;
        if (!a.props.onMission) return;
        a.setState({
          shieldShow: false,
        });
      });

    if (animationProgress > initialFrame - 740 && this.animationState[1] === 0) {
      this.avatarRef.forEach((avatar, i) => {
        const a = avatar.current!;
        if (!a) return;
        if (!a.props.onMission) return;
        const rect_a = this.centerRef.current!.getBoundingClientRect();
        const rect_b = a.shieldLocation.current!.getBoundingClientRect();
        a.setState({
          shieldShow: true,
          shieldPosition: [rect_a.top - rect_b.top, rect_a.left - rect_b.left],
        });
      });

      this.animationState[1]++;
    }

    if (animationProgress > initialFrame && this.animationState[1] === 1) {
      this.avatarRef.forEach((avatar, i) => {
        const a = avatar.current!;
        if (!a) return;
        if (!a.props.onMission) return;
        a.setState({
          shieldPosition: [0, 0],
        });
      });

      this.animationState[1]++;
    }

    if (animationProgress > initialFrame + 700 && this.animationState[1] === 2) {
      this.avatarRef.forEach((avatar, i) => {
        const a = avatar.current!;
        if (!a) return;
        if (!a.props.onMission) return;
        a.setState({
          shieldScale: 1.2,
        });
      });

      this.animationState[1]++;
    }

    if (animationProgress > initialFrame + 950) {
      this.avatarRef.forEach((avatar, i) => {
        const a = avatar.current!;
        if (!a) return;
        if (!a.props.onMission) return;
        a.setState({
          shieldScale: 1,
        });
      });
    } else {
      this.allAnimations[1] = this.animationFrame(this.moveShields);
    }
  }

  leaveLobby() {
    return false;
  }

  renderAvatar = (avatar: AvatarUIProps, i: number, origin: number) => (
    <div className="table-seat" ref={this.seatRef[i + origin]} key={'Seat' + i}>
      <AvatarUI {...avatar} table={this} ref={this.avatarRef[i + origin]} />
    </div>
  );

  render() {
    const game = this.props.game;
    const topO = this.state.left.length;
    const rightO = this.state.top.length + topO;
    const botO = this.state.right.length + rightO;

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
            <div className="table-prow">{this.state.left.map((a, i) => this.renderAvatar(a, i, 0))}</div>
          </div>
          <div className="table-column">
            <div className="table-prow">{this.state.top.map((a, i) => this.renderAvatar(a, i, topO))}</div>
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
            <div className="table-prow">{this.state.bot.map((a, i) => this.renderAvatar(a, i, botO)).reverse()}</div>
          </div>
          <div className="table-column">
            <div className="table-prow">{this.state.right.map((a, i) => this.renderAvatar(a, i, rightO))}</div>
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
