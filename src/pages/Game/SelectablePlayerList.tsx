// External

import React from 'react';
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
  show: boolean;
}

class SelectablePlayerList extends React.PureComponent<SelectablePlayerListProps, SelectablePlayerListState> {
  constructor(props: SelectablePlayerListProps) {
    super(props);
    this.state = {
      selected: '',
      show: false,
    };
    this.onClick = this.onClick.bind(this);
    this.selectPlayer = this.selectPlayer.bind(this);
  }

  onClick() {
    this.props.onSelect(this.state.selected);
    this.props.onExit();
  }

  selectPlayer(player: string) {
    this.setState({ selected: player });
    this.toggleShow();
  }

  toggleShow() {
    this.setState({ show: !this.state.show });
  }

  render() {
    return (
      <div className="settings-form">
        <AvalonScrollbars>
          <form autoComplete="off">
            <p className="title">{this.props.title}</p>
            <div className="input-container">
              <p className="handle">Players</p>{' '}
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
                  this.toggleShow();
                }}
              />
            </div>
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
