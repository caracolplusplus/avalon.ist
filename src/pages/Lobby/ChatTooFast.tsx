// External

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faExclamation } from '@fortawesome/free-solid-svg-icons';

// Internal

import AvalonScrollbars from '../../components/utils/AvalonScrollbars';

// Styles

import '../../styles/Utils/SettingsMenu.scss';

// Types

interface TooFastProps {
  onExit: (...args: any[]) => void;
}

// Declaration

class TooFast extends React.PureComponent<TooFastProps> {
  render() {
    return (
      <div className="settings-form">
        <AvalonScrollbars>
          <form autoComplete="off">
            <FontAwesomeIcon icon={faExclamation} className='unnecessarily-huge-exclamation-mark' />
            <h1>CALM DOWN!</h1>
            <h2>You are sending messages too fast!</h2>
            <p>Wait a few seconds before you start sending messages again.</p>
            <div className="buttons">
              <button className="bt-cancel" type="button" onClick={this.props.onExit}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </form>
        </AvalonScrollbars>
      </div>
    );
  }
}

export default TooFast;
