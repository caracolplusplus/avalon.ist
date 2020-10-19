// External

import React, { ChangeEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import countries from '../../components/countries';

// Internal

import AvalonScrollbars from '../../components/utils/AvalonScrollbars';
import Button from '../../components/utils/Button';
import List from '../../components/utils/ListInput';

// Styles

import '../../styles/Utils/SettingsMenu.scss';

// Types

interface SelectablePlayerListProps {
  text: string;
  title: string;
  nationality: string;
  bio: string;
  onSelect: (...args: any[]) => void;
  onExit: (...args: any[]) => void;
}

interface SelectablePlayerListState {
  nationality: string;
  bio: string;
  show: boolean;
}

class SelectablePlayerList extends React.PureComponent<SelectablePlayerListProps, SelectablePlayerListState> {
  constructor(props: SelectablePlayerListProps) {
    super(props);
    this.state = {
      nationality: props.nationality,
      bio: props.bio,
      show: false,
    };
    this.onClick = this.onClick.bind(this);
    this.selectCountry = this.selectCountry.bind(this);
  }

  onClick() {
    if (this.state.nationality.length < 1 ||this.state.bio.length < 1) return;

    this.props.onSelect(this.state);
    this.props.onExit();
  }

  handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ bio: event.target.value });
  };

  selectCountry(c: string) {
    this.setState({ nationality: c });
    this.togglePlayers();
  }

  togglePlayers() {
    this.setState({ show: !this.state.show });
  }

  render() {
    return (
      <div className="settings-form">
        <AvalonScrollbars>
          <form autoComplete="off">
            <p className="title">{this.props.title}</p>
            <div className="input-container">
              <p className="handle">Nationality</p>{' '}
              <List
                objects={countries.map((c) => {
                  return {
                    text: c.text,
                    onClick: () => {
                      this.selectCountry(c.text);
                    },
                  };
                })}
                show={this.state.show}
                title={this.state.nationality.length > 0 ? this.state.nationality : 'Select a country...'}
                onClick={() => {
                  this.togglePlayers();
                }}
              />
            </div>
            <textarea
              value={this.state.bio}
              onChange={this.handleChange}
              spellCheck={false}
              placeholder="Modify your bio here."
              maxLength={500}
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
