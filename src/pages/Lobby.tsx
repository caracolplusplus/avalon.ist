// External

import React from 'react';
import { connect } from 'react-redux';
// eslint-disable-next-line no-unused-vars
import { rootType } from '../redux/reducers';

// Internal

import AvalonScrollbars from '../components/utils/AvalonScrollbars';

import Navbar from './Navbar';
import Announcements from './Lobby/Announcements';
import NewAvatars from './Lobby/NewAvatars';
import PlayerList from './Lobby/PlayerList';
import Chat from './Lobby/Chat';
import GameList from './Lobby/GameList';

// Styles

import '../styles/Lobby.scss';

interface PageProps {
  style?: any;
}

const mapState = (state: rootType) => {
  const { style } = state;
  return { style };
};

// Declaration

class Lobby extends React.PureComponent<PageProps> {
  initialHeight = Math.max(window.innerHeight, 630);

  render() {
    const theme = this.props.style.themeLight ? 'light' : 'dark';

    return (
      <div id="Background-2" className={`full ${theme}`}>
        <Navbar username="" />
        <AvalonScrollbars>
          <div
            id="Lobby"
            className="section"
            style={{ minHeight: this.initialHeight + 'px' }}
          >
            <div className="column section">
              <div id="Welcome" className="row" />
              <Announcements />
              <NewAvatars />
              <PlayerList players={[]} clients={[]} />
            </div>
            <div className="column section">
              <Chat chatHighlights={{}} players={[]} username="" stage="NONE" />
            </div>
            <div className="column section">
              <GameList />
            </div>
          </div>
        </AvalonScrollbars>
      </div>
    );
  }
}

export default connect(mapState, null)(Lobby);
