// External

// eslint-disable-next-line no-unused-vars
import React, { createRef, RefObject } from 'react';
import { Redirect } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { Dispatch } from 'redux';

// Internal

// eslint-disable-next-line no-unused-vars
import AvatarUIProps from './AvatarUIProps';
import StatusBar from './StatusBar';
// eslint-disable-next-line no-unused-vars
import GameState from './GameState';
import DefaultAvatars from './DefaultAvatars';
// eslint-disable-next-line no-unused-vars
import ConnectedAUI, { AvatarUI } from './AvatarUI';
import Button from '../../components/utils/Button';

// Styles

import '../../styles/Game/Table.scss';
import socket from '../../socket-io/socket-io';

// Declaration

interface TableProps {
  game: GameState;
  dispatch: Dispatch;
}

class MissionTracker extends React.PureComponent<
  { count: number; results: boolean[]; round: number },
  {}
> {
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

    const rounds: boolean[] = new Array(5)
      .fill(false)
      .fill(true, 0, this.props.round + 1);

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

const gummy = DefaultAvatars.gummy;

class Table extends React.PureComponent<
  TableProps,
  {
    avatars: AvatarUIProps[];
    selected: number[];
    redirect: boolean;
  }
> {
  tableRef = createRef<HTMLDivElement>();
  centerRef = createRef<HTMLDivElement>();
  seatRef: RefObject<HTMLDivElement>[] = [];
  avatarRef: RefObject<AvatarUI>[] = [];

  animationCallback: (...args: any[]) => void = () => {};
  animationFrame = (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    window.mozRequestAnimationFrame
  ).bind(window);
  animationFrameCancel = (
    window.cancelAnimationFrame || window.mozCancelAnimationFrame
  ).bind(window);

  animationStart: (number | null)[] = [];
  animationState: number[] = [];
  allAnimations: any[] = [];

  constructor(props: TableProps) {
    super(props);
    this.state = {
      avatars: [],
      redirect: false,
      selected: [],
    };
    this.createSeats = this.createSeats.bind(this);
    this.countSelected = this.countSelected.bind(this);
    this.initAvatars = this.initAvatars.bind(this);
    this.initShields = this.initShields.bind(this);
    this.moveAvatars = this.moveAvatars.bind(this);
    this.moveShields = this.moveShields.bind(this);
    this.leaveLobby = this.leaveLobby.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.initAvatars);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.initAvatars);
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
      this.animationCallback = () => {};

      if (prevProps.game.picks.length !== this.props.game.picks.length)
        this.animationCallback = this.initShields;

      if (
        prevProps.game.players.length !== this.props.game.players.length ||
        prevProps.game.started !== this.props.game.started ||
        prevProps.game.style !== this.props.game.style
      )
        this.animationCallback = this.initAvatars;

      this.createSeats();
    }
  }

  toggleClaim = () => {
    socket.emit('toggleClaim');
  };

  createSeats() {
    this.seatRef = [];
    this.avatarRef = [];

    const game = this.props.game;

    const players = [...game.players];
    const resistance = ['Resistance?', 'Resistance', 'Percival', 'Merlin?', 'Merlin'];

    // Knowledge
    const knowledge =
      game.privateKnowledge.length > 0 && game.ended !== true
        ? [...game.privateKnowledge]
        : [...game.publicKnowledge];

    const defaultA = game.style.avatarStyle
      ? DefaultAvatars.gummy
      : DefaultAvatars.classic;

    // Pre Conditions
    const imKilling = game.assassin && game.stage === 'ASSASSINATION';
    const imPicking = game.seat === game.leader && game.stage === 'PICKING';
    const imCarding = game.seat === game.card && game.stage === 'CARDING';
    const imVoting = game.stage === 'VOTING';

    const avatars: AvatarUIProps[] = [];
    const l = players.length;

    for (let i = 0; i < l; i++) {
      const p = players[i];
      const ave = this.state.avatars[i];

      this.seatRef.push(createRef<HTMLDivElement>());
      this.avatarRef.push(createRef<AvatarUI>());

      // Avatars
      const yourAvatars = game.avatars[i];
      const avatarUrls =
        yourAvatars.res === gummy.res && yourAvatars.spy === gummy.spy
          ? defaultA
          : yourAvatars;

      // Data
      const username = p;
      const role = knowledge[i];
      const vote = game.ended || imVoting ? -1 : game.votesRound[i];
      const leader =
        !game.ended && (game.leader === i || (game.started === false && i === 0));
      const hammer = game.hammer === i;
      const killed = game.assassination === i;
      const card = game.card === i;
      const afk = !game.clients.includes(username);
      const onMission = !game.ended && game.picks.includes(i);
      const isRes = resistance.includes(knowledge[i]);
      const isPickable = imPicking || imKilling || imCarding;
      const isMe = game.seat === i;

      const output: AvatarUIProps = {
        spyUrl: avatarUrls.spy,
        resUrl: avatarUrls.res,
        hasClaimed: game.claimed.includes(username),
        username,
        role,
        vote,
        leader,
        hammer,
        killed,
        card,
        afk,
        onMission,
        isRes,
        isPickable,
        isMe,
        table: null,
        // Animation
        shieldPosition: ave ? ave.shieldPosition : [0, 0],
        shieldShow: ave ? ave.shieldShow : false,
        shieldScale: ave ? ave.shieldScale : 1,
        avatarInitialPosition: ave ? ave.avatarInitialPosition : [0, 0],
        avatarPosition: ave ? ave.avatarPosition : [0, 0],
        avatarShow: ave ? ave.avatarShow : false,
        avatarSize: game.style.avatarSize,
        fontSize: game.style.playFontSize,
        tableWidth: ave ? ave.tableWidth : 0,
        dispatch: this.props.dispatch,
      };

      avatars.push(output);
    }

    this.setState({ avatars }, this.animationCallback);
  }

  countSelected() {
    const selected: number[] = [];

    this.avatarRef.forEach((avatar, i) => {
      const a = avatar.current!;
      if (!a) return;
      if (a.state.avatarSelected) selected.push(i);
    });

    this.setState({ selected });
  }

  initAvatars() {
    if (this.allAnimations[0] !== undefined) {
      this.animationFrameCancel(this.allAnimations[0]);
      this.allAnimations[0] = undefined;
    }

    this.animationStart[0] = null;
    this.allAnimations[0] = this.animationFrame(this.moveAvatars);
  }

  initShields() {
    if (this.allAnimations[1] !== undefined) {
      this.animationFrameCancel(this.allAnimations[1]);
      this.allAnimations[1] = undefined;
    }

    this.animationStart[1] = null;
    this.allAnimations[1] = this.animationFrame(this.moveShields);
  }

  moveAvatars(animationTime: number) {
    let initAnimation: boolean = false;

    if (!this.animationStart[0]) {
      this.animationStart[0] = animationTime;
      this.animationState[0] = 0;
      initAnimation = true;
    }

    const initialFrame = 50;
    const animationProgress = animationTime - this.animationStart[0];

    if (initAnimation)
      this.setState({
        avatars: this.state.avatars.map(
          (a, i): AvatarUIProps => {
            const rect_x = this.tableRef.current!.getBoundingClientRect();
            const rect_a = this.centerRef.current!.getBoundingClientRect();
            const rect_b = this.seatRef[i].current!.getBoundingClientRect();

            return {
              ...a,
              avatarShow: false,
              avatarInitialPosition: [rect_b.height / 2, rect_b.width / 2],
              avatarPosition: [rect_a.top - rect_b.top, rect_a.left - rect_b.left],
              tableWidth: Math.min(rect_x.height * 4.5, rect_x.width),
            };
          }
        ),
      });

    if (animationProgress > initialFrame && this.animationState[0] === 0) {
      this.setState({
        avatars: this.state.avatars.map(
          (a, i): AvatarUIProps => {
            return {
              ...a,
              avatarShow: true,
            };
          }
        ),
      });

      this.animationState[0]++;
    }

    if (animationProgress > initialFrame + 120) {
      this.setState({
        avatars: this.state.avatars.map(
          (a, i): AvatarUIProps => {
            return {
              ...a,
              avatarPosition: a.avatarInitialPosition,
            };
          }
        ),
      });

      this.initShields();
      this.animationState[0]++;
    } else {
      this.allAnimations[0] = this.animationFrame(this.moveAvatars);
    }
  }

  moveShields(animationTime: number) {
    let initAnimation: boolean = false;

    if (!this.animationStart[1]) {
      this.animationStart[1] = animationTime;
      this.animationState[1] = 0;
      initAnimation = true;
    }
    const initialFrame = 50;
    const animationProgress = animationTime - this.animationStart[1];

    if (initAnimation)
      this.setState({
        avatars: this.state.avatars.map(
          (a, i): AvatarUIProps => {
            if (!a.onMission) return a;
            return {
              ...a,
              shieldShow: false,
            };
          }
        ),
      });

    if (animationProgress > initialFrame && this.animationState[1] === 0) {
      this.setState({
        avatars: this.state.avatars.map(
          (a, i): AvatarUIProps => {
            if (!a.onMission) return a;
            const rect_a = this.centerRef.current!.getBoundingClientRect();
            const rect_b = this.avatarRef[
              i
            ].current!.shieldLocation.current!.getBoundingClientRect();
            return {
              ...a,
              shieldShow: true,
              shieldPosition: [rect_a.top - rect_b.top, rect_a.left - rect_b.left],
            };
          }
        ),
      });

      this.animationState[1]++;
    }

    if (animationProgress > initialFrame + 450 && this.animationState[1] === 1) {
      this.setState({
        avatars: this.state.avatars.map(
          (a, i): AvatarUIProps => {
            if (!a.onMission) return a;
            return {
              ...a,
              shieldPosition: [0, 0],
            };
          }
        ),
      });

      this.animationState[1]++;
    }

    if (animationProgress > initialFrame + 900 && this.animationState[1] === 2) {
      this.setState({
        avatars: this.state.avatars.map(
          (a, i): AvatarUIProps => {
            if (!a.onMission) return a;
            return {
              ...a,
              shieldScale: 1.2,
            };
          }
        ),
      });

      this.animationState[1]++;
    }

    if (animationProgress > initialFrame + 1200) {
      this.setState({
        avatars: this.state.avatars.map(
          (a, i): AvatarUIProps => {
            if (!a.onMission) return a;
            return {
              ...a,
              shieldScale: 1,
            };
          }
        ),
      });
    } else {
      this.allAnimations[1] = this.animationFrame(this.moveShields);
    }
  }

  leaveLobby() {
    return false;
  }

  sortAvatars = (mappedAvatars: JSX.Element[]) => {
    const k = mappedAvatars.length;
    const l = Math.floor(k / 2);

    const o: {
      top: JSX.Element[];
      bot: JSX.Element[];
      left: JSX.Element[];
      right: JSX.Element[];
    } = {
      top: [],
      bot: [],
      left: [],
      right: [],
    };

    for (let i = 0; i < k; i++) {
      const e = mappedAvatars[i];

      if (k < 4) {
        switch (i) {
          case 0:
            o.top.push(e);
            break;
          default:
            o.bot.push(e);
            break;
        }
      } else {
        switch (i) {
          case 0:
            o.left.push(e);
            break;
          case l:
            o.right.push(e);
            break;
          default:
            i < l ? o.top.push(e) : o.bot.push(e);
            break;
        }
      }
    }

    return o;
  };

  redirectToLobby = () => {
    this.setState({
      redirect: true,
    });
  };

  render() {
    const avatars = this.state.avatars;
    const mappedAvatars: JSX.Element[] = [];

    for (const i in avatars) {
      const a = avatars[i];

      mappedAvatars.push(
        <div className="table-seat" ref={this.seatRef[i]} key={'Seat' + i}>
          <ConnectedAUI {...a} table={this} ref={this.avatarRef[i]} />
        </div>
      );
    }

    const sortedAvatars = this.sortAvatars(mappedAvatars);

    return this.state.redirect ? (
      <Redirect to="/lobby" />
    ) : (
      <div id="Table" className="tab">
        <div className="table-row table-buttons">
          <Button type="button" text="Exit" onClick={this.redirectToLobby} className="" />
          <Button type="button" text="Claim" onClick={this.toggleClaim} className="" />
        </div>
        <div
          className="table-row table-display"
          ref={this.tableRef}
          style={{ width: '95%' }}
        >
          <div className="table-column">
            <div className="table-prow">{sortedAvatars.left}</div>
          </div>
          <div className="table-column">
            <div className="table-prow">{sortedAvatars.top}</div>
            <div className="table-prow">
              <div className="table-center" ref={this.centerRef}>
                {this.props.game.started ? (
                  <MissionTracker
                    count={Math.max(this.props.game.players.length - 5, 0)}
                    results={this.props.game.results}
                    round={this.props.game.round}
                  />
                ) : null}
              </div>
            </div>
            <div className="table-prow">{sortedAvatars.bot.reverse()}</div>
          </div>
          <div className="table-column">
            <div className="table-prow">{sortedAvatars.right}</div>
          </div>
        </div>
        <div className="table-row table-info">
          <StatusBar {...this.props.game} selected={this.state.selected} />
        </div>
      </div>
    );
  }
}

export default Table;
