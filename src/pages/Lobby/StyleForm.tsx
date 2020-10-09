// External

import React, { FormEvent, ChangeEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { updateStyle } from '../../redux/actions';

// Internal

import AvalonScrollbars from '../../components/utils/AvalonScrollbars';
import socket from '../../socket-io/socket-io';
import Slider from '../../components/utils/Slider';
import RangeSlider from '../../components/utils/RangeSlider';

// Styles

import '../../styles/Utils/SettingsMenu.scss';

// Types

interface StyleFormProps {
  style?: any;
  dispatch?: any;
  onExit: (...args: any[]) => void;
}

// Declaration

class StyleForm extends React.PureComponent<StyleFormProps, any> {
  constructor(props: StyleFormProps) {
    super(props);
    this.state = { ...props.style };
  }

  switchTheme = () => {
    this.setState({ themeLight: !this.state.themeLight });
  };

  switchAvatarStyle = () => {
    this.setState({ avatarStyle: !this.state.avatarStyle });
  };

  handleAvatarSize = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      avatarSize: parseInt(event.target.value),
    });
  };

  handleFontSize = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      playFontSize: parseInt(event.target.value),
    });
  };

  handlePlayArea = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      playArea: parseInt(event.target.value) / 100,
    });
  };

  handleTabs = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      playTabs: parseInt(event.target.value),
    });
  };

  handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    socket.emit('saveTheme', this.state);
    this.props.dispatch(updateStyle(this.state));
    this.props.onExit();
  };

  playAreaSizes = ['Min', 'Tiny', 'Big', 'Max', 'Max'];

  render() {
    return (
      <div className="settings-form">
        <AvalonScrollbars>
          <form autoComplete="off" onSubmit={this.handleSubmit}>
            <p className="title">theme settings</p>
            <p className="subtitle">Aesthetic</p>
            <div className="input-container">
              <Slider value={this.state.themeLight} onClick={this.switchTheme} />
              <p className="handle">{this.state.themeLight ? 'Light Theme' : 'Dark Theme'}</p>
            </div>
            <div className="input-container">
              <Slider value={this.state.avatarStyle} onClick={this.switchAvatarStyle} />
              <p className="handle">{this.state.avatarStyle ? 'New Avatars' : 'Classic Avatars'}</p>
            </div>
            <p className="subtitle">Accessibility</p>
            <div className="input-container">
              <p className="handle">Tabs</p>
              <RangeSlider
                currentDisplay={this.state.playTabs}
                maxDisplay={3}
                min={1}
                max={3}
                value={this.state.playTabs}
                onChange={this.handleTabs}
              />
            </div>
            <div className="input-container">
              <p className="handle">Avatar Size</p>
              <RangeSlider
                currentDisplay={this.state.avatarSize}
                maxDisplay={286}
                min={45}
                max={286}
                value={this.state.avatarSize}
                onChange={this.handleAvatarSize}
              />
            </div>
            <div className="input-container">
              <p className="handle">Font Size</p>
              <RangeSlider
                currentDisplay={this.state.playFontSize}
                maxDisplay={30}
                min={8}
                max={30}
                value={this.state.playFontSize}
                onChange={this.handleFontSize}
              />
            </div>
            <div className="input-container">
              <p className="handle">Game Area</p>
              <RangeSlider
                currentDisplay={this.playAreaSizes[Math.floor(this.state.playArea / 0.25)]}
                maxDisplay={'Max'}
                min={0}
                max={100}
                value={this.state.playArea * 100}
                onChange={this.handlePlayArea}
              />
            </div>

            <div className="buttons">
              <button className="bt-cancel" type="button" onClick={this.props.onExit}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
              <button className="bt-accept" type="submit">
                <FontAwesomeIcon icon={faCheck} />
              </button>
            </div>
          </form>
        </AvalonScrollbars>
      </div>
    );
  }
}

export default StyleForm;
