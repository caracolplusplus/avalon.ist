// External

import React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { rootType } from '../redux/reducers';

// Internal

import AvalonScrollbars from '../components/utils/AvalonScrollbars';
import Navbar from './Navbar';
import Announcements from './Lobby/Announcements';
import NewAvatars from './Lobby/NewAvatars';

// Styles

import '../styles/Lobby.scss';

interface ArticleProps {
  id: string;
}

interface PageProps extends RouteComponentProps<ArticleProps> {
  style?: any;
}

const mapState = (state: rootType) => {
  const { style } = state;
  return { style };
};

// Declaration

class Article extends React.PureComponent<PageProps> {
  initialHeight = Math.max(window.innerHeight, 630);

  render() {
    const theme = this.props.style.themeLight ? 'light' : 'dark';

    return (
      <div id="Background-2" className={'full ' + theme}>
        <Navbar username="" key={'Navbar'} />
        <AvalonScrollbars>
          <div id="Article" className="section" style={{ minHeight: this.initialHeight + 'px' }}>
            <div className="column section">
              <Announcements />
              <NewAvatars />
            </div>
            <div className="column section">{this.props.match.params.id}</div>
          </div>
        </AvalonScrollbars>
      </div>
    );
  }
}

export default connect(mapState, null)(Article);
