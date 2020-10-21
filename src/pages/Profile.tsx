// External

import React from 'react';
import { Redirect, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { rootType } from '../redux/reducers';
import Flag from 'react-world-flags';
import { RouteComponentProps } from 'react-router';
import socket from '../socket-io/socket-io';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Cell, Bar, Tooltip } from 'recharts';
import ReactMarkdown from 'react-markdown';

// Internal

import Navbar from './Navbar';
import AvalonScrollbars from '../components/utils/AvalonScrollbars';
import countries from '../components/countries';
import EditProfile from './Lobby/EditProfile';

// Styles

import '../styles/Profile.scss';

// Declaration

const Percent = (n: number) => Math.trunc(n * 10000) / 100;

const CustomTooltip = ({ active, payload }: { active?: Boolean; payload?: any }) => {
  if (active) {
    const v =
      payload[0].payload.name +
      ': ' +
      payload[0].payload.Winrate +
      '% [ ' +
      payload[0].payload.wins +
      'W / ' +
      (payload[0].payload.total - payload[0].payload.wins) +
      'L ]';
    return (
      <div className="tooltip">
        <p>{v}</p>
      </div>
    );
  }
  return <></>;
};

const SPY_ROLES = new Set(['morgana', 'oberon', 'mordred', 'assassin', 'spy']);

interface ProfileProps {
  username: string;
  myname?: any;
  style?: any;
}

const mapState = (state: rootType, ownProps: any) => {
  const { style } = state;
  const myname = state.username;

  const { username } = ownProps.match.params;
  return {
    match: {
      params: {
        username,
        myname,
        style,
      },
    },
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
      bio: '',
      nationality: 'United Nations',
      // Game
      games: [0, 0],
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
      // From profile page
      redirect: false,
      showSpy: false,
      showForm: false,
    };
  }

  componentDidMount() {
    socket.on('saveProfile', this.onProfileRequest);
    socket.on('profileNotFound', this.onProfileNotFound);
    socket.emit('getProfile', this.props.match.params.username);
  }

  componentWillUnmount() {
    socket.off('saveProfile', this.onProfileRequest);
    socket.off('profileNotFound', this.onProfileNotFound);
  }

  componentDidUpdate(prevProps: RouteComponentProps<ProfileProps>) {
    if (this.props.match.params.username !== prevProps.match.params.username) {
      socket.emit('getProfile', this.props.match.params.username);
    }
  }

  onProfileRequest = (profile: any) => this.setState({ ...this.state, ...profile });

  onProfileNotFound = (profile: any) => this.setState({ redirect: true });

  onHover = () => this.setState({ showSpy: true });

  onStopHover = () => this.setState({ showSpy: false });

  onFormToggle = () => this.setState({ showForm: !this.state.showForm });

  onEdit = (data: any) => {
    socket.emit('editProfile', data);
    this.onFormToggle();
  };

  initialHeight = Math.max(window.innerHeight, 630);

  render() {
    const theme = this.props.match.params.style.themeLight ? 'light' : 'dark';
    var data: any[] = [];
    Object.keys(this.state.gameStats).forEach((k) =>
      data.push({
        name: k.charAt(0).toUpperCase() + k.slice(1),
        wins: this.state.gameStats[k][0],
        total: this.state.gameStats[k][1],
        Winrate:
          this.state.gameStats[k][1] === 0 ? 0 : Percent(this.state.gameStats[k][0] / this.state.gameStats[k][1]),
        color: SPY_ROLES.has(k) ? '#ff6384' : '#36a2eb',
      })
    );
    const country = countries.find((c) => c.text === this.state.nationality);
    const totalWon = this.state.games[0];
    const totalLost = this.state.games[1] - totalWon;
    const winRate = this.state.games[1] > 0 ? Percent(totalWon / this.state.games[1]) : 0;
    const shotRate = this.state.gameShots[1] > 0 ? Percent(this.state.gameShots[0] / this.state.gameShots[1]) : 0;

    const avatars = this.props.match.params.style.avatarStyle ? this.state.avatarGummy : this.state.avatarClassic;

    return this.state.redirect ? (
      <Redirect to="/profile-not-found" />
    ) : (
      <div id="Background-2" className={'full ' + theme}>
        <Navbar username="" key={'Navbar'} />
        <AvalonScrollbars>
          <div id="Profile" style={{ minHeight: this.initialHeight + 'px' }}>
            <div className="row">
              <div id="user">
                <img
                  src={this.state.showSpy ? avatars.spy : avatars.res}
                  alt={'Avatar'}
                  onMouseOver={this.onHover}
                  onMouseLeave={this.onStopHover}
                />
                <div className="user-tag">
                  {country ? (
                    <Flag code={country.value} />
                  ) : (
                    <img
                      alt={'UN'}
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Flag_of_the_United_Nations.svg/800px-Flag_of_the_United_Nations.svg.png"
                    />
                  )}
                  <p>
                    <b>{this.state.user}</b>
                    <br />
                    {this.state.nationality}
                  </p>
                </div>
              </div>
              <div id="bio" style={{ minHeight: this.state.avatarSize }} className="bubble">
                <AvalonScrollbars>
                  <ReactMarkdown
                    className="markdown"
                    allowedTypes={[
                      'root',
                      'text',
                      'paragraph',
                      'emphasis',
                      'strong',
                      'thematicBreak',
                      'blockquote',
                      'list',
                      'listItem',
                      'heading',
                    ]}
                  >
                    {this.state.bio}
                  </ReactMarkdown>
                </AvalonScrollbars>
              </div>
            </div>
            <div className="row">
              <div id="stats">
                <h1>STATISTICS</h1>
                <table>
                  <tbody>
                    <tr>
                      <th>Statistic</th>
                      <th>Value</th>
                    </tr>
                    <tr>
                      <td>Total Games Played</td>
                      <td>{this.state.games[1]}</td>
                    </tr>
                    <tr>
                      <td>Total Games Won</td>
                      <td>{totalWon}</td>
                    </tr>
                    <tr>
                      <td>Total Games Lost</td>
                      <td>{totalLost}</td>
                    </tr>
                    <tr>
                      <td>Total Win Rate</td>
                      <td>{winRate}%</td>
                    </tr>
                    <tr>
                      <td>Shot Accuracy</td>
                      <td>{shotRate}%</td>
                    </tr>
                    <tr>
                      <td>Rating</td>
                      <td>{this.state.gameRating}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div id="graph">
                <ResponsiveContainer width={'100%'} height={300}>
                  <BarChart
                    layout="vertical"
                    margin={{
                      top: 20,
                      right: 20,
                      bottom: 20,
                      left: 20,
                    }}
                    data={data}
                  >
                    <CartesianGrid strokeDasharray="1 1" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" width={100} dataKey="name" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Winrate" fill="#8884d8">
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="row">
              <div id="history">
                <h1>GAME HISTORY</h1>
                <table>
                  <tbody>
                    <tr>
                      <th>Game Link</th>
                    </tr>
                    {this.state.gameHistory.reverse().slice(-10).map((g: string) => (
                      <tr key={"Game" + g}>
                        <td><Link to={"/game/" + g}>Game #{g}</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </AvalonScrollbars>
        {this.props.match.params.myname === this.state.user ? (
          <button className="button-b edit-your-profile-with-this" type="button" onClick={this.onFormToggle}>
            <p>Edit Profile</p>
          </button>
        ) : null}
        {this.state.showForm ? (
          <EditProfile
            onExit={this.onFormToggle}
            text="Submit"
            nationality={this.state.nationality}
            bio={this.state.bio}
            title="EDIT YOUR PROFILE"
            onSelect={this.onEdit}
          />
        ) : null}
      </div>
    );
  }
}

export default connect(mapState, null)(Profile);
