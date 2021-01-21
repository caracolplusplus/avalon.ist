// External

import React from 'react';
import { Link } from 'react-router-dom';

// Internal

// Styles

import Parse from '../../parse/parse';
import '../../styles/Lobby/NewAvatars.scss';

// Declaration

interface AvatarProps {
  user: string;
  avatar: string;
}

interface NewAvatarsState {
  avatarList: any[];
}

const Avatar = (props: AvatarProps) => {
  return (
    <Link
      to={`/profile/${props.user}`}
      className="avatar"
      style={{ backgroundImage: `url(${props.avatar})` }}
    />
  );
};

class NewAvatars extends React.PureComponent<{}, NewAvatarsState> {
  state = {
    avatarList: [],
  };
  mounted: boolean = true;
  avatarsSub: any = null;

  componentDidMount = () => {
    this.setSubscription();
  };

  componentWillUnmount = () => {
    this.mounted = false;
    if (this.avatarsSub) this.avatarsSub.unsubscribe();
  };

  setSubscription = async () => {
    const avatarsQ = new Parse.Query('Avatar');

    this.avatarsSub = await avatarsQ.subscribe();

    this.avatarsSub.on('open', this.latestAvatarsRequest);
    this.avatarsSub.on('create', this.latestAvatarsRequest);
  };

  latestAvatarsRequest = () => {
    Parse.Cloud.run('latestAvatarsRequest').then((result) =>
      this.latestAvatarsResponse(result)
    );
  };

  latestAvatarsResponse = (avatarList: any) => {
    if (!this.mounted) {
      this.avatarsSub.unsubscribe();
      return;
    }

    this.setState({ avatarList });
  };

  render() {
    return (
      <div id="New-Avatars" className="row">
        <h3>
          <p>LATEST AVATARS</p>
        </h3>
        <div className="ave-container">
          {this.state.avatarList.map((a: any, i) => (
            <Avatar avatar={a.avatar} user={a.user} key={a.objectId} />
          ))}
        </div>
      </div>
    );
  }
}

export default NewAvatars;
