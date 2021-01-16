// External

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faExclamation, faCheck } from '@fortawesome/free-solid-svg-icons';

// Internal

import AvalonScrollbars from '../../components/utils/AvalonScrollbars';

// Styles

import '../../styles/Utils/SettingsMenu.scss';

// Types

interface TooFastProps {
  onExit: (...args: any[]) => void;
  isPlaying: boolean;
}

// Declaration

class TooFast extends React.PureComponent<TooFastProps> {
  state = { time: {}, seconds: 10 };
  timer: any = 0;

  secondsToTime = (secs: number) => {
    const hours = Math.floor(secs / (60 * 60));

    const divisor_for_minutes = secs % (60 * 60);
    const minutes = Math.floor(divisor_for_minutes / 60);

    const divisor_for_seconds = divisor_for_minutes % 60;
    const seconds = Math.ceil(divisor_for_seconds);

    const obj = {
      h: hours,
      m: minutes,
      s: seconds,
    };
    return obj;
  };

  componentDidMount = () => {
    const timeLeftVar = this.secondsToTime(this.state.seconds);
    this.setState({ time: timeLeftVar }, this.startTimer);
  };

  componentWillUnmount = () => {
    clearInterval(this.timer);
  };

  startTimer = () => {
    if (this.timer === 0 && this.state.seconds > 0) {
      this.timer = setInterval(this.countDown, 1000);
    }
  };

  sendReadyStateToServer = (ready: boolean) => {
    clearInterval(this.timer);
    this.props.onExit();
  };

  sendFalse = this.sendReadyStateToServer.bind(this, false);
  sendTrue = this.sendReadyStateToServer.bind(this, true);

  countDown = () => {
    // Remove one second, set state so a re-render happens.
    const seconds = this.state.seconds - 1;

    this.setState({
      time: this.secondsToTime(seconds),
      seconds: seconds,
    });

    // Check if we're at zero.
    if (seconds === 0) {
      clearInterval(this.timer);
      this.props.onExit();
    }
  };

  render() {
    const { seconds } = this.state;
    const { isPlaying } = this.props;

    return (
      <div className="settings-form" onSubmit={() => null}>
        <AvalonScrollbars>
          <form autoComplete="off">
            <FontAwesomeIcon
              icon={faExclamation}
              className="unnecessarily-huge-exclamation-mark blue"
            />
            <h1>ARE YOU READY?</h1>
            <h2>GAME IS ABOUT TO START</h2>
            {isPlaying ? (
              <p className="center">
                Confirm that you are ready to start the game. You have {seconds} seconds
                left.
              </p>
            ) : (
              <p className="center">
                Waiting for players to confirm. {seconds} seconds remaining.
              </p>
            )}
            <div className="buttons">
              <button
                className="bt-cancel"
                type="button"
                onClick={isPlaying ? this.sendFalse : this.props.onExit}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
              {isPlaying ? (
                <button className="bt-accept" type="button" onClick={this.sendTrue}>
                  <FontAwesomeIcon icon={faCheck} />
                </button>
              ) : null}
            </div>
          </form>
        </AvalonScrollbars>
      </div>
    );
  }
}

export default TooFast;
