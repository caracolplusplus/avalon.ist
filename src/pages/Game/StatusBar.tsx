// External

import React, { createRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

// Internal

import GameInfo from '../Lobby/GameInfo';
import GameForm from '../Lobby/GameForm';
import Soundboard from '../../sounds/audio';
import ReadyForm from './ReadyForm';
// eslint-disable-next-line no-unused-vars
import GameState from './GameState';
import Button from '../../components/utils/Button';
import SelectablePlayerList from './SelectablePlayerList';
import ReportPlayer from './ReportPlayer';
import MessageBuilder from '../Lobby/MessageBuilder';

// Types

enum FormType {
  // eslint-disable-next-line no-unused-vars
  None = 0,
  // eslint-disable-next-line no-unused-vars
  Settings = 1,
  // eslint-disable-next-line no-unused-vars
  Kick = 2,
  // eslint-disable-next-line no-unused-vars
  Info = 3,
  // eslint-disable-next-line no-unused-vars
  Report = 4,
  // eslint-disable-next-line no-unused-vars
  Ready = 5,
}

interface ButtonProps {
  text: string;
  onClick: ((...args: any[]) => void) | undefined;
  className: string;
}

interface Message {
  text: string;
  buttons: ButtonProps[];
}

interface StatusBarProps extends GameState {
  selected: number[];
}

interface StatusBarState {
  showForm: FormType;
  waitingResponse: boolean;
  hasVoted: boolean;
  previousStage: string;
}

// Declaration

const msgBuilder = new MessageBuilder();
msgBuilder.setEmission('messageToGame');

class StatusBar extends React.PureComponent<StatusBarProps, StatusBarState> {
  state = {
    showForm: FormType.None,
    waitingResponse: false,
    hasVoted: false,
    previousStage: '',
  };

  formRef = createRef<GameForm>();

  componentDidMount = () => {
    // socket.on('gameResponse', this.responseReceived);
    // socket.on('askForReady', this.popUpReady);
  };

  componentWillUnmount = () => {
    // socket.off('gameResponse', this.responseReceived);
    // socket.off('askForReady', this.popUpReady);
  };

  sendServerMessage = (data: any) => {
    msgBuilder.sendServerMessage({
      ch: data.ch,
      content: data.content,
    });
  };

  popUpReady = () => {
    Soundboard.notification.play();

    this.setState({ showForm: FormType.Ready });
  };

  responseReceived = (data: any) => {
    const { previousStage, hasVoted } = this.state;
    const currentStage: string = data.stage;

    this.setState({
      waitingResponse: false,
      previousStage: currentStage,
      hasVoted: previousStage !== currentStage ? false : hasVoted,
    });
  };

  showSettings = () => {
    this.setState({ showForm: FormType.Settings });
  };

  showKick = () => {
    this.setState({ showForm: FormType.Kick });
  };

  showInfo = () => {
    this.setState({ showForm: FormType.Info });
  };

  showReport = () => {
    this.setState({ showForm: FormType.Report });
  };

  sitAndStand = () => {
    // socket.emit('joinLeaveGame');
    this.setState({ waitingResponse: true });
  };

  startGame = () => {
    // socket.emit('startGame');
    this.setState({ waitingResponse: true });
  };

  pickTeam = () => {
    /* socket.emit('pickTeam', {
      team: this.props.selected,
    }); */
    this.setState({ waitingResponse: true });
  };

  voteForMission = (vote: number) => {
    /* socket.emit('voteForMission', {
      vote,
    }); */
    this.setState({ hasVoted: true });
  };

  voteForSuccess = (vote: number) => {
    /* socket.emit('voteForSuccess', {
      vote,
    }); */
    this.setState({ hasVoted: true });
  };

  cardPlayer = () => {
    /* socket.emit('ladyOfTheLake', {
      carded: this.props.selected[0],
    }); */
    this.setState({ waitingResponse: true });
  };

  shootPlayer = () => {
    /* socket.emit('shootPlayer', {
      shot: this.props.selected[0],
    }); */
    this.setState({ waitingResponse: true });
  };

  kickPlayer = (player: string) => {
    const { username } = this.props;

    /* socket.emit('kickPlayer', {
      kick: player,
    }); */

    msgBuilder.sendServerMessage({
      ch: 2,
      content: `${player} has been kicked by ${username}.`,
    });

    this.setState({ waitingResponse: true });
  };

  reportPlayer = (data: any) => {
    // socket.emit('reportPlayer', data);
  };

  onWaiting = (message: Message) => {
    const { seat, players, playerMax, kicked, askedToBeReady } = this.props;

    if (seat === 0) {
      const gameCantStart = players.length < 5 || askedToBeReady;

      message.text = 'Modify settings or start the game.';
      message.buttons = [
        {
          text: 'SETTINGS',
          className: 'neutral',
          onClick: this.showSettings,
        },
        {
          text: 'START',
          className: gameCantStart ? 'disabled' : 'confirm',
          onClick: gameCantStart ? undefined : this.startGame,
        },
        {
          text: 'STAND UP',
          className: askedToBeReady ? 'disabled' : 'cancel',
          onClick: askedToBeReady ? undefined : this.sitAndStand,
        },
        {
          text: 'KICK',
          className: 'kick',
          onClick: this.showKick,
        },
      ];
    } else {
      const host = players[0];
      const hasSeat = seat > -1;
      const unableToSit = kicked || players.length >= playerMax || askedToBeReady;
      const sittingClass = hasSeat ? 'cancel' : 'confirm';

      message.text = host
        ? `Waiting for ${host} to start the game.`
        : 'Waiting for a new host.';
      message.buttons = [
        {
          text: 'INFO',
          className: 'neutral',
          onClick: this.showInfo,
        },
        {
          text: hasSeat ? 'STAND UP' : 'SIT',
          className: unableToSit ? 'disabled' : sittingClass,
          onClick: unableToSit ? undefined : this.sitAndStand,
        },
      ];
    }

    return message;
  };

  onPicking = (message: Message) => {
    const { leader, seat, players, mission, selected } = this.props;

    if (leader === seat) {
      const n = [
        [2, 3, 2, 3, 3],
        [2, 3, 4, 3, 4],
        [2, 3, 3, 4, 4],
        [3, 4, 4, 5, 5],
        [3, 4, 4, 5, 5],
        [3, 4, 4, 5, 5],
      ][players.length - 5][mission];
      const notEnoughPicks = n !== selected.length;

      message.text = `It's your turn to select a team. Choose ${n} players.`;
      message.buttons = [
        {
          text: 'CONFIRM',
          className: notEnoughPicks ? 'disabled' : 'confirm',
          onClick: notEnoughPicks ? undefined : this.pickTeam,
        },
      ];
    } else {
      const _leader = players[leader];

      message.text = `Waiting for ${_leader} to select a team.`;
    }

    return message;
  };

  onVoting = (message: Message) => {
    const { hasVoted } = this.state;
    const { seat, leader, players, username, picks, votesPending } = this.props;

    if (seat > -1 && votesPending.includes(username) && !hasVoted) {
      const _leader = players[leader];
      const team = players.filter((p, i) => picks.includes(i)).toString();

      message.text = `Its your turn to vote. ${_leader} has selected: ${team.replace(
        /,/g,
        ', '
      )}`;
      message.buttons = [
        {
          text: 'APPROVE',
          className: 'confirm',
          onClick: () => this.voteForMission(1),
        },
        {
          text: 'REJECT',
          className: 'cancel',
          onClick: () => this.voteForMission(0),
        },
      ];
    } else {
      message.text = `Waiting for ${votesPending
        .toString()
        .replace(/,/g, ', ')} to vote.`;
    }

    return message;
  };

  onMission = (message: Message) => {
    const { hasVoted } = this.state;
    const { username, seat, imRes, picksYetToVote } = this.props;

    if (seat > -1 && picksYetToVote.includes(username) && !hasVoted) {
      message.text = 'Its your turn to vote. Choose the fate of this mission.';
      message.buttons = [
        {
          text: 'SUCCEED',
          className: 'confirm',
          onClick: () => this.voteForSuccess(1),
        },
        {
          text: 'FAIL',
          className: imRes ? 'disabled' : 'cancel',
          onClick: imRes ? undefined : () => this.voteForSuccess(0),
        },
      ];
    } else {
      message.text = `Waiting for ${picksYetToVote
        .toString()
        .replace(/,/g, ', ')} to vote.`;
    }

    return message;
  };

  onCarding = (message: Message) => {
    const { seat, card, players, selected, cardHolders } = this.props;

    if (seat > -1 && seat === card) {
      const target = selected[0];
      const cannotCard =
        selected.length !== 1 || seat === target || cardHolders.includes(target);

      message.text = 'You have Lady of the Lake. Select a player to reveal their role.';
      message.buttons = [
        {
          text: 'CONFIRM',
          className: cannotCard ? 'disabled' : 'confirm',
          onClick: cannotCard ? undefined : this.cardPlayer,
        },
      ];
    } else {
      const remaining = players[card];
      message.text = `Waiting for ${remaining} to use lady of the lake.`;
    }

    return message;
  };

  onAssassination = (message: Message) => {
    const { seat, username, selected, assassinName, privateKnowledge } = this.props;

    if (seat > -1 && assassinName === username) {
      const target = selected[0];
      const cannotKill =
        selected.length !== 1 ||
        seat === target ||
        ['Spy', 'Spy?'].includes(privateKnowledge[target]);

      message.text = 'Is your turn to kill Merlin! Choose a target.';
      message.buttons = [
        {
          text: 'CONFIRM',
          className: cannotKill ? 'disabled' : 'confirm',
          onClick: cannotKill ? undefined : this.shootPlayer,
        },
      ];
    } else {
      message.text = `Waiting for ${assassinName} to select a target.`;
    }

    return message;
  };

  inProgress = (message: Message) => {
    switch (this.props.stage) {
      case 'PICKING':
        return this.onPicking(message);
      case 'VOTING':
        return this.onVoting(message);
      case 'MISSION':
        return this.onMission(message);
      case 'CARDING':
        return this.onCarding(message);
      case 'ASSASSINATION':
        return this.onAssassination(message);
      default:
        return message;
    }
  };

  onFinish = (message: Message) => {
    const { cause } = this.props;

    message.text = [
      'Merlin has been killed! The Spies Win.',
      'Merlin was not killed! The Resistance wins.',
      'Three missions have failed! The Spies Win.',
      'Mission hammer was rejected! The Spies Win.',
      'Three missions have succeeded! The Resistance wins.',
    ][cause ? cause : 0];

    return message;
  };

  onFreeze = (message: Message) => {
    const { ended } = this.props;

    if (ended === false) {
      message.text = 'The game has been paused by a moderator.';
    } else if (ended === true) {
      message.text = 'The game has been frozen by a moderator.';
    }

    return message;
  };

  onReplay = (message: Message) => {
    const { code } = this.props;

    message.text = `This is a replay of game #${code}.`;

    return message;
  };

  hideForm = () => this.setState({ showForm: FormType.None });

  defaultMessage: Message = {
    text: '',
    buttons: [],
  };

  render() {
    const {
      code,
      started,
      frozen,
      ended,
      seat,
      players,
      playerMax,
      roleSettings,
      active,
    } = this.props;
    const { showForm, waitingResponse } = this.state;

    let message: Message = { ...this.defaultMessage };

    if (!started) {
      message = this.onWaiting(message);
    } else if (!frozen) {
      if (!ended) {
        message = this.inProgress(message);
      } else {
        message = this.onFinish(message);
      }
    } else {
      message = this.onFreeze(message);
    }

    if (!active) {
      message = this.onReplay(message);
    }

    if (waitingResponse) {
      message.text = 'Waiting for server response...';
      message.buttons = [];
    }

    let form = null;
    if (!started && showForm !== FormType.None) {
      if (showForm === FormType.Kick && seat === 0) {
        form = (
          <SelectablePlayerList
            title="Select a player to kick"
            text="Kick"
            // Skip the first player, since that's the game host and you can't kick yourself.
            players={players.slice(1)}
            onExit={this.hideForm}
            onSelect={(player: string) => {
              this.kickPlayer(player);
            }}
          />
        );
      }
      if (showForm === FormType.Settings && seat === 0) {
        form = (
          <GameForm
            title="MODIFY GAME SETTINGS"
            createsGame={false}
            initialRoleSettings={roleSettings}
            initialPlayerMax={playerMax}
            onExit={this.hideForm}
          />
        );
      }
      if (showForm === FormType.Info) {
        form = (
          <GameInfo
            roleSettings={roleSettings}
            playerMax={playerMax}
            onExit={this.hideForm}
          />
        );
      }
      if (showForm === FormType.Ready) {
        form = <ReadyForm onExit={this.hideForm} isPlaying={seat > -1} />;
      }
    }
    if (showForm === FormType.Report) {
      const arr = [...players];
      if (seat > -1) arr.splice(seat, 1);

      form = (
        <ReportPlayer
          title="report player"
          text="Report"
          players={arr}
          onExit={this.hideForm}
          onSelect={this.reportPlayer}
        />
      );
    }

    return code === '-1' ? null : (
      <>
        <div className="nice-bar-above">
          <div className="button-b players">
            <p>
              {players.length}/{playerMax}
            </p>
          </div>
          <button
            className="button-b report-someone-with-this"
            type="button"
            onClick={this.showReport}
          >
            <p>
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="exclamation-mark"
              />
              Report
            </p>
          </button>
        </div>
        <p className="message">{message.text}</p>{' '}
        {message.buttons.map((b, i) => (
          <div className="button-cont" key={i + b.className}>
            <Button type="button" {...b} />{' '}
          </div>
        ))}
        {form}
      </>
    );
  }
}

export default StatusBar;
