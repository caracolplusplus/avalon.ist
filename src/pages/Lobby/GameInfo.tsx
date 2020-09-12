// External

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

// Internal

import AvalonScrollbars from '../../components/utils/AvalonScrollbars';

// Styles

import '../../styles/Utils/SettingsMenu.scss';

// Types

interface GameFormProps {
  onExit: (...args: any[]) => void;
  roleSettings: {
    merlin: boolean;
    percival: boolean;
    morgana: boolean;
    assassin: boolean;
    oberon: boolean;
    mordred: boolean;
    card: boolean;
  };
  playerMax: number;
}

// Declaration

class GameForm extends React.PureComponent<GameFormProps> {
  render() {
    const roleArr = [];
    const cardArr = [];

    if (this.props.roleSettings.merlin) roleArr.push('Merlin');
    if (this.props.roleSettings.percival) roleArr.push('Percival');
    if (this.props.roleSettings.morgana) roleArr.push('Morgana');
    if (this.props.roleSettings.assassin) roleArr.push('Assassin');
    if (this.props.roleSettings.oberon) roleArr.push('Oberon');
    if (this.props.roleSettings.mordred) roleArr.push('Mordred');
    if (this.props.roleSettings.card) cardArr.push('Lady of the Lake');

    return (
      <div className="settings-form">
        <AvalonScrollbars>
          <form autoComplete="off">
            <p className="title">GAME INFO</p>
            <p className="subtitle">Player Max</p>
            <div className="input-container">
              <p className="handle">{this.props.playerMax}</p>{' '}
            </div>
            <p className="subtitle">Roles</p>
            <div className="input-container">
              <p className="handle">{roleArr.toString().replace(/,/g, ', ')}</p>{' '}
            </div>
            <p className="subtitle">Cards</p>
            <div className="input-container">
              <p className="handle">{cardArr.toString().replace(/,/g, ', ')}</p>{' '}
            </div>
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

export default GameForm;
