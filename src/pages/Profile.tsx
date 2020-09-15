// External

import React from 'react'
import { RouteComponentProps } from 'react-router'
import Navbar from './Navbar';
import socket from '../socket-io/socket-io';
// Styles

import '../styles/Globals.scss'

// Declaration

interface ProfileProps {
  username: string
}

class Profile extends React.PureComponent<RouteComponentProps<ProfileProps>, any> {
    constructor(props: RouteComponentProps<ProfileProps>) {
        super(props);
        this.state = {
        user: '',
        // Personality
        avatarClassic: {
            spy: 'to_define',
            res: 'to_define',
        },
        avatarGummy: {
            spy: 'to_define',
            res: 'to_define',
        },
        bio: 'This is my account on Avalon.ist.',
        nationality: 'United Nations',
        // Game
        games: 0,
        gameStats: {
            merlin: [0, 0],
            percival: [0, 0],
            resistance: [0, 0],
            assassin: [0, 0],
            morgana: [0, 0],
            oberon: [0, 0],
            mordred: [0, 0],
            spy: [0, 0],
        },
        gameHistory: [],
        gameShots: [0, 0],
        gameRating: 1500,
        // Customizing
        playArea: 0,
        playTabs: 2,
        playFontSize: 14,
        avatarSize: 140,
        avatarStyle: true,
        themeLight: false,
        // Roles
        isAdmin: false,
        isMod: false,
        isContrib: false,

        // Banned
        banned: false,
        }
    }

    componentDidMount() {
        socket.on('saveProfile', (profile: any) => this.setState(profile));
        socket.emit('getProfile', this.props.match.params.username);
    }


    initialHeight = Math.max(window.innerHeight, 630);

    render() {
        return (
            <div id="Background-2" className={'full light'}>
                <Navbar username="" />

                <div>
                    {this.state.user}
                    {this.state.gameStats.merlin}
                </div>
            </div>
        );
    }
}

export default Profile
