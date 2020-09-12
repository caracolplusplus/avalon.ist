// External

import React from 'react'
import { RouteComponentProps } from 'react-router'

// Styles

import '../styles/Globals.scss'

// Declaration

interface ProfileProps {
  username: string
}

class Profile extends React.PureComponent<RouteComponentProps<ProfileProps>, {}> {
  player: string = "I don't exist"

  render() {
    return (
      <p>
        This is {this.props.match.params.username}'s profile: {this.player}
      </p>
    )
  }
}

export default Profile
