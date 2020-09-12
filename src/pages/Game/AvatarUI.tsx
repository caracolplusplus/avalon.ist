// Import External Components

import React, { createRef } from 'react';
import { faStamp, faPen, faPaintBrush, faCheck, faGavel, faAddressCard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SketchPicker, ColorResult, RGBColor } from 'react-color';

// Import Internal Components

import AvalonScrollbars from '../../components/utils/AvalonScrollbars';
import AvatarUIProps from './AvatarUIProps';

// Import Styles

import '../../styles/Game/AvatarUI.scss';

// Class Definition

class AvatarUI extends React.PureComponent<
  AvatarUIProps,
  {
    currentBackground: number;
    currentHighlight: RGBColor;
    renderPicker: boolean;
    renderButtons: boolean;
    avatarSelected: boolean;
  }
> {
  background = ['none', 'res', 'spy'];
  shieldLocation = createRef<HTMLDivElement>();

  constructor(props: AvatarUIProps) {
    super(props);
    this.state = {
      currentBackground: 0,
      currentHighlight: {
        r: 255,
        g: 204,
        b: 0,
        a: 100,
      },
      renderPicker: false,
      renderButtons: false,
      avatarSelected: false,
    };
    this.handleHighlight = this.handleHighlight.bind(this);
  }

  componentDidUpdate(prevProps: AvatarUIProps) {
    if (prevProps.isPickable !== this.props.isPickable) {
      this.setState({
        avatarSelected: false,
      });
    }
  }

  handleHighlight(color: ColorResult) {
    this.setState({ currentHighlight: color.rgb });
  }

  renderButtonsTrue = () => this.setState({ renderButtons: true });

  renderButtonsFalse = () => this.setState({ renderButtons: false });

  pickPlayer = () =>
    this.setState(
      {
        avatarSelected: this.props.isPickable && !this.state.avatarSelected,
      },
      this.props.table!.countSelected
    );

  setBackgroundColor = () =>
    this.setState({
      currentBackground: (this.state.currentBackground + 1) % 3,
    });

  showColorPicker = () =>
    this.setState({
      renderPicker: !this.state.renderPicker,
    });

  hideColorPicker = () =>
    this.setState({
      renderPicker: !this.state.renderPicker,
    });

  render() {
    return (
      <>
        <div
          id="Avatar-UI"
          style={{
            top: this.props.avatarPosition[0] + 'px',
            left: this.props.avatarPosition[1] + 'px',
            display: this.props.avatarShow ? undefined : 'none',
          }}
          onMouseOver={this.renderButtonsTrue}
          onMouseLeave={this.renderButtonsFalse}
        >
          <div
            id="ave-graphics"
            style={{
              width: this.props.avatarSize + 'px',
              height: this.props.avatarSize + 'px',
              maxHeight: Math.max(this.props.tableWidth * 0.06, 45) + 'px',
              maxWidth: Math.max(this.props.tableWidth * 0.06, 45) + 'px',
              opacity: this.props.afk ? '0.5' : '1',
            }}
          >
            <div
              id="ave-background"
              className={
                this.background[this.state.currentBackground] +
                ' ' +
                (this.state.avatarSelected && this.props.isPickable ? 'picked' : '')
              }
            />
            <div
              className={
                'ave tooltip ' +
                (this.props.killed ? 'killed ' : '') +
                (this.props.isPickable ? 'pickable' : 'not-pickable')
              }
              style={{
                backgroundImage: 'url(' + (this.props.isRes ? this.props.resUrl : this.props.spyUrl) + ')',
              }}
              onClick={this.pickPlayer}
            >
              {this.props.isPickable ? <span className="tooltip-text">Click on this player to pick them</span> : null}
            </div>
            {this.props.killed ? <div className="ave-sword" /> : null}
            {this.props.onMission ? (
              <div className="ave-shield" ref={this.shieldLocation}>
                {this.props.shieldShow ? (
                  <div
                    style={{
                      transform: 'scale(' + this.props.shieldScale + ')',
                      top: this.props.shieldPosition[0] + 'px',
                      left: this.props.shieldPosition[1] + 'px',
                    }}
                    className="ave-shield-display"
                  />
                ) : null}
              </div>
            ) : null}
            {this.props.leader ? <div className="ave-flag" /> : null}
            {this.props.vote > -1 ? <div className={'ave-vote-bubble ' + (this.props.vote === 1)} /> : null}
            {this.state.renderButtons ? (
              <div className="ave-buttons">
                <button onClick={this.setBackgroundColor} className="tooltip">
                  <span className="tooltip-text">Mark this player's allegiance</span>
                  <FontAwesomeIcon icon={faStamp} />
                </button>
                <button className="tooltip">
                  <span className="tooltip-text">Highlight this player's chat messages</span>
                  <FontAwesomeIcon icon={faPen} />
                </button>
                <button onClick={this.showColorPicker} className="tooltip">
                  <span className="tooltip-text">Change this player's highlight color</span>
                  <FontAwesomeIcon icon={faPaintBrush} />
                </button>
              </div>
            ) : null}
          </div>
          <p
            className={'ave-username ' + (this.props.isMe ? 'me' : '')}
            style={{
              width: Math.max(this.props.tableWidth * 0.15, 40) + 'px',
              fontSize: Math.max(this.props.tableWidth * 0.01, 10) + 'px',
            }}
          >
            {this.props.card ? <FontAwesomeIcon icon={faAddressCard} /> : null}{' '}
            {this.props.hammer ? <FontAwesomeIcon icon={faGavel} /> : null} {this.props.username}
          </p>
          <p
            className={'ave-role ' + this.props.isRes}
            style={{
              opacity: this.props.role !== 'Spy?' && this.props.role !== 'Resistance?' ? '1' : '0',
              fontSize: Math.max(this.props.tableWidth * 0.008, 8) + 'px',
            }}
          >
            {this.props.role}
          </p>
        </div>
        {this.state.renderPicker ? (
          <div className="hl-picker">
            <AvalonScrollbars>
              <div className="hl-stuff">
                <p>CHANGE HIGHLIGHT COLOR</p>
                <SketchPicker color={this.state.currentHighlight} onChange={this.handleHighlight} />
                <button onClick={this.hideColorPicker}>
                  <FontAwesomeIcon icon={faCheck} />
                </button>
              </div>
            </AvalonScrollbars>
          </div>
        ) : null}
      </>
    );
  }
}

export default AvatarUI;
