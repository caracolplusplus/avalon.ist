// External

import React from 'react';

// Internal

import socket from '../../socket-io/socket-io';

// Styles

import '../../styles/Lobby/NewAvatars.scss';

// Declaration

interface AvatarProps {
  url: string;
}

interface NewAvatarsState {
  urlList: string[];
}

const Avatar = (props: AvatarProps) => {
  return <div className="avatar" style={{ backgroundImage: 'url(' + props.url + ')' }} />;
};

class NewAvatars extends React.PureComponent<{}, NewAvatarsState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      urlList: [],
    };
  }

  componentDidMount() {
    socket.on('latestAvatarsResponse', this.onResponse);

    socket.emit('latestAvatarsRequest');
  }

  componentWillUnmount() {
    socket.off('latestAvatarsResponse', this.onResponse);
  }

  onResponse = (urlList: string[]) => {
    urlList = urlList.reverse();
    this.setState({ urlList });
  };

  render() {
    return (
      <div id="New-Avatars" className="row">
        <h3>
          <p>LATEST AVATARS</p>
        </h3>
        <div className="ave-container">
          {this.state.urlList.map((a, i) => (
            <Avatar url={a} key={'newAvatar' + i} />
          ))}
        </div>
      </div>
    );
  }
}

export default NewAvatars;
