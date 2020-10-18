// External

import React from 'react'
import { connect } from 'react-redux';
import { rootType } from '../redux/reducers';
import { RouteComponentProps } from 'react-router'
import socket from '../socket-io/socket-io';
import { BarChart , CartesianGrid, XAxis, YAxis, Cell, Bar, Tooltip} from 'recharts';


// Internal

import Navbar from './Navbar';
import AvalonScrollbars from '../components/utils/AvalonScrollbars';

// Styles

import '../styles/Profile.scss';

// Declaration

const Percent = (n: number) => Math.trunc(n * 10000) / 100;

const CustomTooltip = ({ active, payload }: { active?: Boolean, payload?: any }) => {
    if (active) {
        const v = payload[0].payload.name + ': ' + payload[0].payload.Winrate  + '% [ ' + payload[0].payload.wins + 'W / ' + (payload[0].payload.total - payload[0].payload.wins) + 'L ]';
        return (
            <div className="tooltip">
                <p>
                    {v}
                </p>
            </div>
        );
    }
    return (<></>);
};

const SPY_ROLES = new Set([
    'morgana',
    'oberon',
    'mordred',
    'spy'
]);

interface ProfileProps {
  username: string;
  style?: any;
}

const mapState = (state: rootType, ownProps: any) => {
    const { style } = state;
    const { username } = ownProps.match.params;
    return {
        match: {
            params: {
                username,
                style
            }
        }
    };
  };

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
        const theme = this.props.match.params.style.themeLight ? 'light' : 'dark';
        var data : any[] = [];
        Object.keys(this.state.gameStats).forEach(k => data.push({
            name: k.charAt(0).toUpperCase() + k.slice(1),
            wins: this.state.gameStats[k][0],
            total: this.state.gameStats[k][1],
            Winrate: this.state.gameStats[k][1] === 0 ? 0 : Percent(this.state.gameStats[k][0] / this.state.gameStats[k][1]),
            color: SPY_ROLES.has(k) ? '#ff6384' : '#36a2eb',
        }));
        const totalWon = data.reduce((a, c) => a + c.wins, 0);
        const totalLost = this.state.games - totalWon;
        const winRate = this.state.games > 0 ? Percent(totalWon / this.state.games) : 0;
        return (
            <div id="Background-2" className={'full ' + theme}>
                <Navbar username="" key={'Navbar'} />
                <AvalonScrollbars>
                    <div id="Profile" style={{ minHeight: this.initialHeight + 'px' }}>
                        <div className="row">
                            <div id="user">
                                <img width={this.state.avatarSize} src={this.state.avatarGummy.res} alt={"Avatar"} />
                                <p><b>{this.state.user}</b></p>
                                <p>{this.state.nationality}</p>
                            </div>
                            <div id="bio" style={{ minHeight: this.state.avatarSize }} className="bubble">
                                <p>
                                    {this.state.bio}
                                </p>
                            </div>
                        </div>
                        <div className="row">
                            <div id="stats">
                                <h1>STATISTICS</h1>
                                <table>
                                    <tbody>
                                    <tr>
                                        <th>Total Games Played</th>
                                        <td>{this.state.games}</td>
                                    </tr>
                                    <tr>
                                        <th>Total Games Won</th>
                                        <td>{totalWon}</td>
                                    </tr>
                                    <tr>
                                        <th>Total Games Lost</th>
                                        <td>{totalLost}</td>
                                    </tr>
                                    <tr>
                                        <th>Total Win Rate</th>
                                        <td>{winRate}%</td>
                                    </tr>
                                    <tr>
                                        <th>Rating</th>
                                        <td>{this.state.gameRating}</td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div id="graph">
                                <BarChart layout="vertical" width={1000} height={400} data={data}>
                                    <CartesianGrid strokeDasharray="1 1" />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="name" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="Winrate" fill="#8884d8">
                                        {
                                            data.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))
                                        }
                                    </Bar>
                                </BarChart>
                            </div>
                        </div>
                    </div>

                </AvalonScrollbars>
            </div>
        );
    }
}

export default connect(mapState, null)(Profile);
