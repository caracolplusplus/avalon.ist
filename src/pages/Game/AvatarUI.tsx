// Import External Components

import React, { Component, createRef } from 'react'
import {
  faStamp,
  faPen,
  faPaintBrush,
  faCheck,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SketchPicker, ColorResult, RGBColor } from 'react-color'

// Import Internal Components

import Table from './Table'

// Import Styles

import '../../styles/Game/AvatarUI.scss'

// Class Definition

interface AvatarUIProps {
  spyUrl: string
  resUrl: string
  username: string
  onMission: boolean
  leader: boolean
  isRes: boolean
  isPickable: boolean
  role: string
  vote: number
  table: Table
}

class AvatarUI extends Component<
  AvatarUIProps,
  {
    shieldPosition: [number, number]
    shieldScale: number
    shieldShow: boolean
    avatarInitialPosition: [number, number]
    avatarPosition: [number, number]
    avatarShow: boolean
    avatarSize: number
    currentBackground: number
    currentHighlight: RGBColor
    renderPicker: boolean
    renderButtons: boolean
    picked: boolean
    width: number
  }
> {
  background = ['none', 'res', 'spy']
  shieldLocation = createRef<HTMLDivElement>()

  constructor(props: AvatarUIProps) {
    super(props)
    this.state = {
      shieldPosition: [0, 0],
      shieldShow: false,
      shieldScale: 1,
      avatarInitialPosition: [0, 0],
      avatarPosition: [0, 0],
      avatarShow: false,
      avatarSize: 350,
      currentBackground: 0,
      currentHighlight: {
        r: 255,
        g: 204,
        b: 0,
        a: 100,
      },
      renderPicker: false,
      renderButtons: false,
      picked: false,
      width: 0,
    }
    this.handleHighlight = this.handleHighlight.bind(this)
  }

  componentDidUpdate(prevProps: AvatarUIProps) {
    if (prevProps.isPickable !== this.props.isPickable) {
      this.setState({
        picked: false
      })
    }
  }

  handleHighlight(color: ColorResult) {
    this.setState({ currentHighlight: color.rgb })
  }

  render() {
    return (
      <>
        <div
          id="Avatar-UI"
          style={{
            top: this.state.avatarPosition[0] + 'px',
            left: this.state.avatarPosition[1] + 'px',
            display: this.state.avatarShow ? undefined : 'none',
          }}
          onMouseOver={() => this.setState({ renderButtons: true })}
          onMouseLeave={() => this.setState({ renderButtons: false })}
        >
          <div
            id="ave-graphics"
            style={{
              width: this.state.avatarSize + 'px',
              height: this.state.avatarSize + 'px',
              maxHeight: Math.max(this.state.width * 0.06, 45) + 'px',
              maxWidth: Math.max(this.state.width * 0.06, 45) + 'px',
            }}
          >
            <div
              id="ave-background"
              className={
                this.background[this.state.currentBackground] +
                ' ' +
                (this.state.picked && this.props.isPickable ? 'picked' : '')
              }
            />
            <div
              className={
                (this.props.isRes ? 'ave-res' : 'ave-spy') +
                ' tooltip ' +
                (this.props.isPickable ? 'pickable' : 'not-pickable')
              }
              style={{
                backgroundImage:
                  'url(' +
                  (this.props.isRes ? this.props.resUrl : this.props.spyUrl) +
                  ')',
              }}
              onClick={() => 
                this.setState({
                  picked: this.props.isPickable && !this.state.picked,
                }, this.props.table.countSelected)
              }
            >
              {this.props.isPickable ? (
                <span className="tooltip-text">
                  Click on this player to pick them
                </span>
              ) : null}
            </div>
            {this.props.onMission ? (
              <div className="ave-shield" ref={this.shieldLocation}>
                {this.state.shieldShow ? (
                  <div
                    style={{
                      transform: 'scale(' + this.state.shieldScale + ')',
                      top: this.state.shieldPosition[0] + 'px',
                      left: this.state.shieldPosition[1] + 'px',
                    }}
                    className="ave-shield-display"
                  />
                ) : null}
              </div>
            ) : null}
            {this.props.leader ? <div className="ave-flag" /> : null}
            {this.props.vote > -1 ? (
              <div className={'ave-vote-bubble ' + (this.props.vote === 1)} />
            ) : null}
            {this.state.renderButtons ? (
              <div className="ave-buttons">
                <button
                  onClick={() =>
                    this.setState({
                      currentBackground: (this.state.currentBackground + 1) % 3,
                    })
                  }
                  className="tooltip"
                >
                  <span className="tooltip-text">
                    Mark this player's allegiance
                  </span>
                  <FontAwesomeIcon icon={faStamp} />
                </button>
                <button className="tooltip">
                  <span className="tooltip-text">
                    Highlight this player's chat messages
                  </span>
                  <FontAwesomeIcon icon={faPen} />
                </button>
                <button
                  onClick={() =>
                    this.setState({
                      renderPicker: !this.state.renderPicker,
                    })
                  }
                  className="tooltip"
                >
                  <span className="tooltip-text">
                    Change this player's highlight color
                  </span>
                  <FontAwesomeIcon icon={faPaintBrush} />
                </button>
              </div>
            ) : null}
          </div>
          <p
            className="ave-username"
            style={{
              width: Math.max(this.state.width * 0.15, 40) + 'px',
              fontSize: Math.max(this.state.width * 0.01, 10) + 'px',
            }}
          >
            {this.props.username}
          </p>
          <p
            className={'ave-role ' + this.props.isRes}
            style={{
              opacity:
                this.props.role !== 'Spy?' && this.props.role !== 'Resistance?'
                  ? '1'
                  : '0',
              fontSize: Math.max(this.state.width * 0.008, 8) + 'px',
            }}
          >
            {this.props.role}
          </p>
        </div>
        {this.state.renderPicker ? (
          <div className="hl-picker">
            <div className="hl-stuff">
              <p>CHANGE HIGHLIGHT COLOR</p>
              <SketchPicker
                color={this.state.currentHighlight}
                onChange={this.handleHighlight}
              />
              <button
                onClick={() =>
                  this.setState({
                    renderPicker: !this.state.renderPicker,
                  })
                }
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
            </div>
          </div>
        ) : null}
      </>
    )
  }
}

export default AvatarUI
