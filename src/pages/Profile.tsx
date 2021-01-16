/* global Set */

// eslint-disable-next-line no-unused-vars
import { RouteComponentProps } from 'react-router';
import { Redirect, Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { rootType } from '../redux/reducers';
import { connect } from 'react-redux';
import React from 'react';
import Flag from 'react-world-flags';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
  Bar,
  Tooltip,
} from 'recharts';

import DefaultAvatars from './Game/DefaultAvatars';
import ReactMarkdown from 'react-markdown';
import EditProfile from './Lobby/EditProfile';
import Navbar from './Navbar';
import AvalonScrollbars from '../components/utils/AvalonScrollbars';
import countries from '../components/countries';

import '../styles/Profile.scss';

const SPY_ROLES = new Set(['morgana', 'oberon', 'mordred', 'assassin', 'spy']);
const UN_FLAG = `https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Flag_of_the_United_Nations.svg/800px-Flag_of_the_United_Nations.svg.png`;
const STONEWALL_FLAG =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Gay_Pride_Flag.svg/2560px-Gay_Pride_Flag.svg.png';
const gummy = DefaultAvatars.gummy;

const Percent = (n: number) => Math.trunc(n * 10000) / 100;

const CustomTooltip = ({ active, payload }: { active?: Boolean; payload?: any }) => {
  if (active) {
    const { name, Winrate, wins, total } = payload[0].payload;
    const v = `${name}: ${Winrate}% [ ${wins}W / ${total - wins}L ]`;

    return (
      <div className="tooltip">
        <p>{v}</p>
      </div>
    );
  }

  return <></>;
};

interface ProfileProps {
  username: string;
  myname?: any;
  style?: any;
}

interface ProfileState {
  username: string;
  avatars: {
    spy: string;
    res: string;
  };
  bio: string;
  nationality: string;
  games: number[];
  gameStats: {
    [role: string]: number[];
  };
  gameHistory: string[];
  gameShots: number[];
  gameRating: number;
  redirect: boolean;
  showSpy: boolean;
  showForm: boolean;
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

class Profile extends React.PureComponent<
  RouteComponentProps<ProfileProps>,
  ProfileState
> {
  state: ProfileState = {
    username: '',
    // Personality
    avatars: {
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

  componentDidMount = () => {
    const { username } = this.props.match.params;
  };

  componentWillUnmount = () => {};

  componentDidUpdate = (prevProps: RouteComponentProps<ProfileProps>) => {
    const { username } = this.props.match.params;
    const { username: prevUsername } = prevProps.match.params;

    if (username !== prevUsername) {
      console.log('hai');
    }
  };

  onProfileRequest = (profile: ProfileState) => {
    const {
      style: { avatarStyle },
    } = this.props.match.params;

    const defaultA = avatarStyle ? DefaultAvatars.gummy : DefaultAvatars.classic;

    const yourAvatars = profile.avatars;
    const avatarUrls =
      yourAvatars.res === gummy.res && yourAvatars.spy === gummy.spy
        ? defaultA
        : yourAvatars;

    this.setState({ ...profile, avatars: avatarUrls });
  };

  onProfileNotFound = (profile: any) => this.setState({ redirect: true });

  onHover = () => this.setState({ showSpy: true });

  onStopHover = () => this.setState({ showSpy: false });

  onFormToggle = () => this.setState({ showForm: !this.state.showForm });

  onEdit = (data: any) => {
    this.onFormToggle();
  };

  initialHeight = Math.max(window.innerHeight, 630);

  render() {
    const { initialHeight } = this;
    const {
      myname,
      style: { themeLight },
    } = this.props.match.params;

    const theme = themeLight ? 'light' : 'dark';
    const data: any[] = [];

    // const { avatarStyle } = this.props.match.params.style;
    const {
      username,
      nationality,
      bio,
      gameRating,
      gameHistory,
      games,
      gameStats,
      gameShots,
      avatars,
      showSpy,
      redirect,
    } = this.state;

    for (const k in gameStats) {
      const stat = gameStats[k];

      data.push({
        name: k.charAt(0).toUpperCase() + k.slice(1),
        wins: stat[0],
        total: stat[1],
        Winrate: stat[1] === 0 ? 0 : Percent(stat[0] / stat[1]),
        color: SPY_ROLES.has(k) ? '#ff6384' : '#36a2eb',
      });
    }

    const country = countries.find((c) => c.text === nationality);
    const totalWon = games[0];
    const totalLost = games[1] - totalWon;
    const winRate = games[1] > 0 ? Percent(totalWon / games[1]) : 0;
    const shotRate = gameShots[1] > 0 ? Percent(gameShots[0] / gameShots[1]) : 0;

    let countryFlag = <img alt={'UN'} src={UN_FLAG} />;
    if (country && country.value != 'UN') {
      if (country.value == 'LGBT') {
        countryFlag = <img alt={'Stonewall'} src={STONEWALL_FLAG} />;
      } else {
        countryFlag = <Flag code={country.value} />;
      }
    }

    return redirect ? (
      <Redirect to="/profile-not-found" />
    ) : (
      <div id="Background-2" className={`full ${theme}`}>
        <Navbar username="" key={'Navbar'} />
        <AvalonScrollbars>
          <div id="Profile" style={{ minHeight: `${initialHeight}px` }}>
            <div className="row">
              <div id="user">
                <img
                  src={showSpy ? avatars.spy : avatars.res}
                  alt={'Avatar'}
                  onMouseOver={this.onHover}
                  onMouseLeave={this.onStopHover}
                />
                <div className="user-tag">
                  {countryFlag}
                  <p>
                    <b>{username}</b>
                    <br />
                    {nationality}
                  </p>
                </div>
              </div>
              <div id="bio" className="bubble">
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
                    {bio}
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
                      <td>{games[1]}</td>
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
                      <td>{gameRating}</td>
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
                      <th>Game</th>
                      <th>Role</th>
                      <th>Size</th>
                      <th>Winner</th>
                      <th>Date</th>
                    </tr>
                    {gameHistory
                      .slice(-10)
                      .reverse()
                      .map((g: any, i) => {
                        const date = new Date(g.date);
                        const month = ('00' + (date.getUTCMonth() + 1)).slice(-2);
                        const day = ('00' + date.getUTCDate()).slice(-2);
                        const year = date.getUTCFullYear();

                        return (
                          <tr key={'Game' + g.id}>
                            <td>
                              <Link to={'/game/' + g.id}>#{g.code}</Link>
                            </td>
                            <td>{g.role}</td>
                            <td>{g.size}</td>
                            <td>{g.winner ? 'Resistance' : 'Spy'}</td>
                            <td>
                              {year}-{month}-{day}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </AvalonScrollbars>
        {myname === username ? (
          <button
            className="button-b edit-your-profile-with-this"
            type="button"
            onClick={this.onFormToggle}
          >
            <p>Edit Profile</p>
          </button>
        ) : null}
        {this.state.showForm ? (
          <EditProfile
            onExit={this.onFormToggle}
            text="Submit"
            nationality={nationality}
            bio={bio}
            title="EDIT YOUR PROFILE"
            onSelect={this.onEdit}
          />
        ) : null}
      </div>
    );
  }
}

export default connect(mapState, null)(Profile);
