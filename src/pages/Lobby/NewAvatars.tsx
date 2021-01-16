// External

import React from 'react';

// Internal

// Styles

import Parse from '../../parse/parse';
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

  envSub: any = null;

  componentDidMount = () => {
    this.setSubscription();
  };

  componentWillUnmount = () => {
    this.envSub.unsubscribe();
  };

  setSubscription = async () => {
    const envQ = new Parse.Query('Environment');

    this.envSub = await envQ.subscribe();

    this.envSub.on('open', this.latestAvatarsRequest);
    this.envSub.on('update', (env: any) => {
      this.latestAvatarsResponse(env.get('avatarLogs').slice(-3));
    });
  };

  latestAvatarsRequest = () => {
    Parse.Cloud.run('latestAvatarsRequest').then((result) =>
      this.latestAvatarsResponse(result)
    );
  };

  latestAvatarsResponse = (avatarList: any) => {
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
