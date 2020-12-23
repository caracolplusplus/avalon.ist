// External

import React, { ChangeEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

// Internal

import AvalonScrollbars from '../../components/utils/AvalonScrollbars';
import Button from '../../components/utils/Button';
import List from '../../components/utils/ListInput';

// Styles

import '../../styles/Utils/SettingsMenu.scss';

// Types

interface SelectablePlayerListProps {
  players: string[];
  text: string;
  title: string;
  onSelect: (...args: any[]) => void;
  onExit: (...args: any[]) => void;
}

interface SelectablePlayerListState {
  selected: string;
  cause: string;
  description: string;
  show: boolean;
  show2: boolean;
}

class SelectablePlayerList extends React.PureComponent<SelectablePlayerListProps, SelectablePlayerListState> {
  constructor(props: SelectablePlayerListProps) {
    super(props);
    this.state = {
      selected: '',
      cause: '',
      description: '',
      show: false,
      show2: false,
    };
    this.onClick = this.onClick.bind(this);
    this.selectPlayer = this.selectPlayer.bind(this);
    this.selectMotive = this.selectMotive.bind(this);
  }

  causeList = [
    'Abusive Language',
    'Gamethrowing',
    'Unfair influence',
    'Spectator influence',
    'Cheating',
    'Stalling / AFK',
    'Inappropiate Content',
    'Doxxing',
    'Other',
  ];

  onClick() {
    if (this.state.selected.length < 1 || this.state.cause.length < 1 || this.state.description.length < 1) return;

    this.props.onSelect(this.state);
    this.props.onExit();
  }

  handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ description: event.target.value });
  };

  selectPlayer(player: string) {
    this.setState({ selected: player });
    this.togglePlayers();
  }

  selectMotive(motive: string) {
    this.setState({ cause: motive });
    this.toggleMotive();
  }

  togglePlayers() {
    this.setState({ show: !this.state.show });
  }

  toggleMotive() {
    this.setState({ show2: !this.state.show2 });
  }

  render() {
    return (
      <div className="settings-form">
        <AvalonScrollbars>
          <form autoComplete="off">
            <p className="title">{this.props.title}</p>
            <p className="subtitle">Required Fields</p>
            <div className="input-container">
              <p className="handle">Player</p>{' '}
              <List
                objects={this.props.players.map((player) => {
                  return {
                    text: player,
                    onClick: () => {
                      this.selectPlayer(player);
                    },
                  };
                })}
                show={this.state.show}
                title={this.state.selected.length > 0 ? this.state.selected : 'Select a player...'}
                onClick={() => {
                  this.togglePlayers();
                }}
              />
            </div>
            <div className="input-container">
              <p className="handle">Motive</p>{' '}
              <List
                objects={this.causeList.map((cause) => {
                  return {
                    text: cause,
                    onClick: () => {
                      this.selectMotive(cause);
                    },
                  };
                })}
                show={this.state.show2}
                title={this.state.cause.length > 0 ? this.state.cause : 'Select a motive...'}
                onClick={() => {
                  this.toggleMotive();
                }}
              />
            </div>
            <textarea
              value={this.state.description}
              onChange={this.handleChange}
              spellCheck={false}
              placeholder="Write a description of your case here."
              maxLength={100}
            />
            <div className="buttons">
              <button className="bt-cancel" type="button" onClick={this.props.onExit}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
              <Button className="" type="button" text={this.props.text} onClick={this.onClick} />
            </div>
          </form>
        </AvalonScrollbars>
      </div>
    );
  }
}

export default SelectablePlayerList;
