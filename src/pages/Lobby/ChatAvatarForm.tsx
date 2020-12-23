// External

// eslint-disable-next-line no-unused-vars
import React, { ChangeEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

// Internal

import AvalonScrollbars from '../../components/utils/AvalonScrollbars';
import Button from '../../components/utils/Button';

// Styles

import '../../styles/Utils/SettingsMenu.scss';

// Types

interface SelectablePlayerListProps {
  onSelect: (...args: any[]) => void;
  onExit: (...args: any[]) => void;
}

interface SelectablePlayerListState {
  user: string;
  res: string;
  spy: string;
}

class SelectablePlayerList extends React.PureComponent<
  SelectablePlayerListProps,
  SelectablePlayerListState
> {
  state = {
    user: '',
    res: 'https://i.ibb.co/M8RXC95/base-res.png',
    spy: 'https://i.ibb.co/sJcthnM/base-spy.png',
  };

  onClick = () => {
    const { user, res, spy } = this.state;

    if (user.length < 1 || res.length < 1 || spy.length < 1) return;

    this.props.onSelect(this.state);
    this.props.onExit();
  };

  handleUser = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ user: event.target.value });
  };

  handleRes = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ res: event.target.value });
  };

  handleSpy = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ spy: event.target.value });
  };

  render() {
    return (
      <div className="settings-form">
        <AvalonScrollbars>
          <form autoComplete="off">
            <p className="title">upload an avatar</p>
            <p className="subtitle">User</p>
            <input
              type="text"
              placeholder="User"
              value={this.state.user}
              name="id"
              onChange={this.handleUser}
            />
            <p className="subtitle">Resistance Avatar</p>
            <input
              type="text"
              placeholder="Resistance"
              value={this.state.res}
              name="res"
              onChange={this.handleRes}
            />
            <p className="subtitle">Spy Avatar</p>
            <input
              type="text"
              placeholder="Spy"
              value={this.state.spy}
              name="spy"
              onChange={this.handleSpy}
            />
            <div className="img" style={{ backgroundImage: `url(${this.state.res})` }} />
            <div className="img" style={{ backgroundImage: `url(${this.state.spy})` }} />
            <div className="buttons">
              <button className="bt-cancel" type="button" onClick={this.props.onExit}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
              <Button className="" type="button" text="Upload" onClick={this.onClick} />
            </div>
          </form>
        </AvalonScrollbars>
      </div>
    );
  }
}

export default SelectablePlayerList;
