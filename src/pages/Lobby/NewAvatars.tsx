// External

import React from 'react';

// Internal

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
    // socket.on('avatarsResponse', this.onResponse);
    // socket.emit('avatarsRequest');
  }

  componentWillUnmount() {
    // socket.off('avatarsResponse', this.onResponse);
  }

  onResponse = (avatarList: any) => {
    const urlList: string[] = avatarList.map((a: any) => a.avatar).reverse();
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
