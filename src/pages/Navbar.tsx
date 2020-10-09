// External

import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faSignOutAlt, faCog } from '@fortawesome/free-solid-svg-icons';

// Internal

import AvalonScrollbars from '../components/utils/AvalonScrollbars';
import { rootType } from '../redux/reducers';

import { logout } from '../components/auth/logout';
import StyleForm from './Lobby/StyleForm';

// Styles

import '../styles/Navbar.scss';

// Types

const mapState = (state: rootType) => {
  const { username, style } = state;
  return { username, style };
};

interface NavbarState {
  points: [number, number, number];
  showSidebar: boolean;
  showSettings: boolean;
}

// Declaration

class Navbar extends React.PureComponent<{ username: string, style?: any, dispatch?: any }, NavbarState> {
  constructor(props: { username: string }) {
    super(props);
    this.state = {
      points: [0, 0, 0],
      showSidebar: false,
      showSettings: false,
    };
    this.setClipPath = this.setClipPath.bind(this);
    this.toggleSidebar = this.toggleSidebar.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.setClipPath);
    this.setClipPath();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setClipPath);
  }

  setClipPath() {
    const inner = document.getElementById('Inner')!;
    const outer = document.getElementById('Outer')!;

    this.setState({
      points: [
        inner.clientHeight / 2,
        outer.clientWidth - inner.clientHeight / 2,
        inner.clientWidth - inner.clientHeight / 2,
      ],
    });
  }

  toggleSidebar() {
    this.setState({ showSidebar: !this.state.showSidebar });
  }

  toggleSettings = () => {
    this.setState({ showSettings: !this.state.showSettings });
  };

  hideSettings = () => {
    this.setState({ showSettings: false });
  };

  handleLogout() {
    logout();
  }

  render() {
    return (
      <div>
        <div id="Navbar-Full" className="section">
          <div id="Navbar" className="section">
            <div className="logo" />
            <div
              id="Outer"
              style={{
                clipPath:
                  'polygon(0 0, 100% 0,' +
                  this.state.points[1] +
                  'px 50%, 100% 100%, 0 100%, ' +
                  this.state.points[0] +
                  'px 50%)',
              }}
              className="links outer"
            >
              <div
                id="Inner"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, ' + this.state.points[0] + 'px 50%)',
                }}
                className="links inner"
              >
                <div>
                  <Link to="/lobby">LOBBY</Link>
                  <Link to="/start-here">START HERE</Link>
                  <Link to="/community">COMMUNITY</Link>
                  <Link to="/stats">STATS</Link>
                  <Link to="/dev">DEVELOPMENT</Link>
                </div>
                <div>
                  <Link to={'/profile/' + this.props.username}>{this.props.username}</Link>
                  <button onClick={this.toggleSettings}>
                    <FontAwesomeIcon icon={faCog} />
                  </button>
                  <button onClick={this.handleLogout}>
                    <FontAwesomeIcon icon={faSignOutAlt} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div id="Navbar-Mobile" className="section">
            <div className="logo" />
            <button onClick={this.toggleSidebar}>
              <FontAwesomeIcon icon={faList} />
            </button>
          </div>
        </div>
        {this.state.showSettings ? <StyleForm onExit={this.hideSettings} style={this.props.style} dispatch={this.props.dispatch} /> : null}
        <div
          className="links list"
          style={{
            transform: this.state.showSidebar ? 'translate(0%, 0%)' : 'translate(100%, 0%)',
          }}
        >
          <AvalonScrollbars>
            <div className="links container">
              <Link to="/lobby">LOBBY</Link>
              <Link to="/start-here">START HERE</Link>
              <Link to="/community">COMMUNITY</Link>
              <Link to="/stats">STATS</Link>
              <Link to="/dev">DEVELOPMENT</Link>
              <div />
              <Link to={'/profile/' + this.props.username}>PROFILE</Link>
              <button onClick={this.toggleSettings}>SETTINGS</button>
              <button onClick={this.handleLogout}>LOG OUT</button>
            </div>
          </AvalonScrollbars>
        </div>
      </div>
    );
  }
}

export default connect(mapState, null)(Navbar);
