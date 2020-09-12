// External

import React, { createRef } from 'react';

// Internal

import socket from '../../socket-io/socket-io';
import GameInfo from '../Lobby/GameInfo';
import GameForm from '../Lobby/GameForm';
import GameState from './GameState';
import Button from '../../components/utils/Button';

// Types

interface Message {
  loading: boolean;
  text: string;
  showButtonOne: boolean;
  showButtonTwo: boolean;
  showButtonThree: boolean;
  buttonOne: {
    type: 'button';
    text: string;
    onClick: ((...args: any[]) => void) | undefined;
    className: string;
  };
  buttonTwo: {
    type: 'button';
    text: string;
    onClick: ((...args: any[]) => void) | undefined;
    className: string;
  };
  buttonThree: {
    type: 'button';
    text: string;
    onClick: ((...args: any[]) => void) | undefined;
    className: string;
  };
}

interface StatusBarProps extends GameState {
  selected: number[];
}

interface StatusBarState {
  showForm: boolean;
}

// Declaration

class StatusBar extends React.PureComponent<StatusBarProps, StatusBarState> {
  formRef = createRef<GameForm>();

  constructor(props: StatusBarProps) {
    super(props);
    this.state = {
      showForm: false,
    };
    this.formSetup = this.formSetup.bind(this);
    this.sitAndStand = this.sitAndStand.bind(this);
    this.startGame = this.startGame.bind(this);
    this.pickTeam = this.pickTeam.bind(this);
    this.voteForMission = this.voteForMission.bind(this);
    this.voteForSuccess = this.voteForSuccess.bind(this);
    this.shootPlayer = this.shootPlayer.bind(this);
    this.cardPlayer = this.cardPlayer.bind(this);
  }

  formSetup() {
    this.setState({ showForm: true });
  }

  sitAndStand() {
    socket.emit('joinLeaveGame', {
      canSit: true,
    });
  }

  startGame() {
    socket.emit('startGame');
  }

  pickTeam() {
    socket.emit('pickTeam', {
      team: this.props.selected,
    });
  }

  voteForMission(vote: number) {
    socket.emit('voteForMission', {
      vote,
    });
  }

  voteForSuccess(vote: number) {
    socket.emit('voteForSuccess', {
      vote,
    });
  }

  cardPlayer() {
    socket.emit('cardPlayer', {
      carded: this.props.selected[0],
    });
  }

  shootPlayer() {
    socket.emit('shootPlayer', {
      shot: this.props.selected[0],
    });
  }

  onWaiting(message: Message) {
    message.loading = false;

    if (this.props.seat === 0) {
      const gameCantStart = this.props.players.length < 5;

      message.showButtonThree = true;
      message.text = 'Modify settings or start the game.';
      message.buttonOne.text = 'SETTINGS';
      message.buttonOne.className = 'neutral';
      message.buttonOne.onClick = this.formSetup;
      message.buttonTwo.text = 'START';
      message.buttonTwo.className = gameCantStart ? 'disabled' : 'confirm';
      message.buttonTwo.onClick = gameCantStart ? undefined : this.startGame;
      message.buttonThree.text = 'STAND UP';
      message.buttonThree.className = 'cancel';
      message.buttonThree.onClick = this.sitAndStand;
    } else {
      const host = this.props.players[0];
      const hasSeat = this.props.seat > -1;

      message.text = 'Waiting for ' + host + ' to start the game.';
      message.buttonOne.text = 'INFO';
      message.buttonOne.className = 'neutral';
      message.buttonOne.onClick = this.formSetup;
      message.buttonTwo.text = hasSeat ? 'STAND UP' : 'SIT';
      message.buttonTwo.className = hasSeat ? 'cancel' : 'confirm';
      message.buttonTwo.onClick = this.sitAndStand;
    }

    return message;
  }

  onPicking(message: Message) {
    message.loading = false;

    if (this.props.leader === this.props.seat) {
      const n = this.props.picks.length;
      const notEnoughPicks = this.props.picks.length !== this.props.selected.length;

      message.showButtonTwo = false;
      message.text = "It's your turn to select a team. Choose " + n + ' players.';
      message.buttonOne.text = 'CONFIRM';
      message.buttonOne.className = notEnoughPicks ? 'disabled' : 'confirm';
      message.buttonOne.onClick = notEnoughPicks ? undefined : this.pickTeam;
    } else {
      const leader = this.props.players[this.props.leader];
      message.showButtonOne = false;
      message.showButtonTwo = false;
      message.text = 'Waiting for ' + leader + ' to select a team.';
    }

    return message;
  }

  onVoting(message: Message) {
    message.loading = false;

    if (this.props.seat > -1 && this.props.votesRound[this.props.seat] < 0) {
      const leader = this.props.players[this.props.leader];
      const team = this.props.players.filter((p, i) => this.props.picks.includes(i)).toString();

      message.text = 'Its your turn to vote. ' + leader + ' has selected: ' + team.replace(/,/g, ', ');
      message.buttonOne.text = 'APPROVE';
      message.buttonOne.className = 'confirm';
      message.buttonOne.onClick = () => this.voteForMission(1);
      message.buttonTwo.text = 'REJECT';
      message.buttonTwo.className = 'cancel';
      message.buttonTwo.onClick = () => this.voteForMission(0);
    } else {
      const remaining = this.props.players.filter((p, i) => this.props.votesRound[i] < 0).toString();

      message.showButtonOne = false;
      message.showButtonTwo = false;
      message.text = 'Waiting for ' + remaining.replace(/,/g, ', ') + ' to vote.';
    }

    return message;
  }

  onMission(message: Message) {
    message.loading = false;

    if (this.props.seat > -1 && this.props.voted.includes(this.props.seat)) {
      message.text = 'Its your turn to vote. Choose the fate of this mission.';
      message.buttonOne.text = 'SUCCEED';
      message.buttonOne.className = 'confirm';
      message.buttonOne.onClick = () => this.voteForSuccess(1);
      message.buttonTwo.text = 'FAIL';
      message.buttonTwo.className = this.props.imRes ? 'disabled' : 'cancel';
      message.buttonTwo.onClick = this.props.imRes ? undefined : () => this.voteForSuccess(0);
    } else {
      const remaining = this.props.players.filter((p, i) => this.props.voted.includes(i)).toString();

      message.showButtonOne = false;
      message.showButtonTwo = false;
      message.text = 'Waiting for ' + remaining.replace(/,/g, ', ') + ' to vote.';
    }

    return message;
  }

  onCarding(message: Message) {
    message.loading = false;

    if (this.props.seat > -1 && this.props.seat === this.props.card) {
      const target = this.props.selected[0];
      const cannotCard =
        this.props.selected.length !== 1 || this.props.seat === target || this.props.cardHolders.includes(target);

      message.showButtonTwo = false;
      message.text = 'You have Lady of the Lake. Select a player to reveal their role.';
      message.buttonOne.text = 'CONFIRM';
      message.buttonOne.className = cannotCard ? 'disabled' : 'confirm';
      message.buttonOne.onClick = cannotCard ? undefined : this.cardPlayer;
    } else {
      const remaining = this.props.players[this.props.card];
      message.showButtonOne = false;
      message.showButtonTwo = false;
      message.text = 'Waiting for ' + remaining + ' to use lady of the lake.';
    }

    return message;
  }

  onAssassination(message: Message) {
    message.loading = false;

    if (this.props.seat > -1 && this.props.assassin) {
      const target = this.props.selected[0];
      const cannotKill =
        this.props.selected.length !== 1 ||
        this.props.seat === target ||
        ['Spy', 'Spy?'].includes(this.props.privateKnowledge[target]);

      message.showButtonTwo = false;
      message.text = 'Is your turn to kill Merlin! Choose a target.';
      message.buttonOne.text = 'CONFIRM';
      message.buttonOne.className = cannotKill ? 'disabled' : 'confirm';
      message.buttonOne.onClick = cannotKill ? undefined : this.shootPlayer;
    } else {
      message.showButtonOne = false;
      message.showButtonTwo = false;
      message.text = 'Waiting for assassin to select a target.';
    }

    return message;
  }

  inProgress(message: Message) {
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
  }

  onFinish(message: Message) {
    message.loading = false;
    message.showButtonOne = false;
    message.showButtonTwo = false;
    message.text = [
      'Merlin has been killed! The Spies Win.',
      'Merlin was not killed! The Resistance wins.',
      'Three missions have failed! The Spies Win.',
      'Mission hammer was rejected! The Spies Win.',
      'Three missions have succeeded! The Resistance wins.',
    ][this.props.cause ? this.props.cause : 0];

    return message;
  }

  onFreeze(message: Message) {
    message.loading = false;
    message.showButtonOne = false;
    message.showButtonTwo = false;

    if (this.props.ended === false) {
      message.text = 'The game has been paused by a moderator.';
    } else if (this.props.ended === true) {
      message.text = 'The game has been frozen by a moderator.';
    }

    return message;
  }

  hideForm = () => this.setState({ showForm: false });

  message: Message = {
    loading: true,
    text: '',
    showButtonOne: true,
    showButtonTwo: true,
    showButtonThree: false,
    buttonOne: {
      type: 'button',
      text: '',
      onClick: () => {},
      className: '',
    },
    buttonTwo: {
      type: 'button',
      text: '',
      onClick: () => {},
      className: '',
    },
    buttonThree: {
      type: 'button',
      text: '',
      onClick: () => {},
      className: '',
    },
  };

  defaultMessage = { ...this.message };

  render() {
    this.message = { ...this.defaultMessage };

    if (!this.props.started) {
      this.message = this.onWaiting(this.message);
    } else if (!this.props.frozen) {
      if (!this.props.ended) {
        this.message = this.inProgress(this.message);
      } else {
        this.message = this.onFinish(this.message);
      }
    } else {
      this.message = this.onFreeze(this.message);
    }

    return this.props.code < 0 ? null : (
      <>
        <p className="message">{this.message.text}</p>{' '}
        {this.message.showButtonOne ? (
          <div className="button-cont">
            {' '}
            <Button {...this.message.buttonOne} />{' '}
          </div>
        ) : null}
        {this.message.showButtonTwo ? (
          <div className="button-cont">
            <Button {...this.message.buttonTwo} />{' '}
          </div>
        ) : null}
        {this.message.showButtonThree ? (
          <div className="button-cont">
            {' '}
            <Button {...this.message.buttonThree} />{' '}
          </div>
        ) : null}
        {!this.props.started && this.state.showForm ? (
          this.props.seat === 0 ? (
            <GameForm
              title="MODIFY GAME SETTINGS"
              createsGame={false}
              initialRoleSettings={this.props.roleSettings}
              initialPlayerMax={this.props.playerMax}
              onExit={this.hideForm}
            />
          ) : (
            <GameInfo roleSettings={this.props.roleSettings} playerMax={this.props.playerMax} onExit={this.hideForm} />
          )
        ) : null}
      </>
    );
  }
}

export default StatusBar;
