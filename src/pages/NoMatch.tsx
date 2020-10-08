// External

import React from 'react';
import { connect } from 'react-redux';
import { rootType } from '../redux/reducers';

// Internal

import AvalonScrollbars from '../components/utils/AvalonScrollbars';

import Navbar from './Navbar';

// Styles

import '../styles/Verify.scss';

// Declaration

interface PageProps {
  style?: any;
}

const mapState = (state: rootType) => {
  const { style } = state;
  return { style };
};

class NoMatch extends React.PureComponent<PageProps> {
  initialHeight = window.innerHeight;

  render() {
        const theme = this.props.style.themeLight ? 'light' : 'dark';

    return (
      <div id="Background-2" className={'full ' + theme}>
        <Navbar username="" />
        <AvalonScrollbars>
          <div id="Verify" style={{ minHeight: this.initialHeight + 'px' }} className="section">
            <div className="not-found" />
            <h2>THE SPIES HAVE STOLEN THIS PAGE.</h2>
            <p>404. Page not found.</p>
          </div>
        </AvalonScrollbars>
      </div>
    );
  }
}

export default connect(mapState, null)(NoMatch);
