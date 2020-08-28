// External

import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

// Internal

import AvalonScrollbars from '../../components/utils/AvalonScrollbars';

import GameState from './GameState';

// Styles

import '../../styles/Game/VoteHistory.scss';

// Declaration

interface VoteHistoryProps {
  game: GameState;
}

interface VoteHistoryState {
  loading: boolean;
  rowHeight: number;
}

class VoteHistory extends Component<VoteHistoryProps, VoteHistoryState> {
  constructor(props: VoteHistoryProps) {
    super(props);
    this.state = {
      loading: true,
      rowHeight: 0,
    };
    this.setRowHeight = this.setRowHeight.bind(this);
    this.SetHeaders = this.SetHeaders.bind(this);
    this.SetPlayers = this.SetPlayers.bind(this);
    this.DisplayCardHolders = this.DisplayCardHolders.bind(this);
  }

  setRowHeight() {
    if (this.state.loading) return;

    const vhWidth = document.getElementById('Vote-History')!.offsetWidth;

    this.setState({ rowHeight: vhWidth / 70 });
  }

  componentDidMount() {
    this.setState(
      {
        loading: false,
      },
      this.setRowHeight
    );
    window.addEventListener('resize', this.setRowHeight);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setRowHeight);
  }

  componentDidUpdate(prevProps: { game: GameState }) {
    const old = prevProps.game;
    const current = this.props.game;

    if (
      old.results !== current.results ||
      old.missionLeader !== current.missionLeader ||
      old.missionVotes !== current.missionVotes ||
      old.missionTeams !== current.missionTeams
    )
      this.setState(
        {
          loading: false,
        },
        this.setRowHeight
      );
  }

  SetHeaders() {
    const items: JSX.Element[] = [];

    const game = this.props.game;

    for (let i = 0; i < 5; i++) {
      if (game.missionVotes[i].length > 0)
        items.push(
          <th className={'vh-row mission ' + game.results[i]} colSpan={game.missionVotes[i].length} key={'Mission' + i}>
            Mission {i + 1}
          </th>
        );
    }

    return (
      <tr className="vh-col" style={{ fontSize: this.state.rowHeight + 'px' }}>
        <th className="vh-row title">Players</th>
        {items}
      </tr>
    );
  }

  SetPlayers(props: { p: string; ip: number }) {
    let items: JSX.Element[] = [];

    const game = this.props.game;
    const votes = ['undefined', 'false', 'true'];

    for (let i = 0; i < 5; i++) {
      if (game.missionVotes[i].length > 0)
        items = items.concat(
          game.missionVotes[i].map((v, iv) => (
            <td
              className={
                (game.missionLeader[i][iv] === props.ip ? 'leader ' : '') + 'vh-vote ' + votes[v[props.ip] + 1]
              }
              key={'M' + i + iv + 'P' + props.ip}
            >
              {game.missionTeams[i][iv]?.includes(props.ip) ? (
                <FontAwesomeIcon className="checkmark" icon={faCheck} />
              ) : null}
            </td>
          ))
        );
    }

    return (
      <tr className="vh-col" style={{ fontSize: this.state.rowHeight + 'px' }}>
        <td className="vh-row">{props.p}</td>
        {items}
      </tr>
    );
  }

  DisplayCardHolders() {
    const game = this.props.game;
    const holders = [...game.cardHolders];

    switch (game.mission) {
      case 0:
        holders.push(game.card);
        break;
      case 1:
        holders.push(game.card);
        holders.push(game.card);
        break;
      default:
        holders.push(game.card);
        holders.unshift(holders[0]);
        break;
    }

    const items = holders.map((p, i) => (
      <td className="vh-row lotl" key={'holder' + i} colSpan={game.missionVotes[i].length}>
        {game.players[p]}
      </td>
    ));

    return (
      <tr className="vh-col" style={{ fontSize: this.state.rowHeight + 'px' }}>
        <td className="vh-row lotl title">Lady of the Lake</td>
        {items}
      </tr>
    );
  }

  render() {
    return (
      <AvalonScrollbars>
        <div id="Vote-History" className="row">
          {this.state.loading ? null : (
            <table id="vh-cont" className="vh-cont">
              <tbody>
                <this.SetHeaders />
                {this.props.game.players.map((p, i_p) => (
                  <this.SetPlayers ip={i_p} p={p} key={p} />
                ))}
                {this.props.game.started && this.props.game.card > -1 ? <this.DisplayCardHolders /> : null}
              </tbody>
            </table>
          )}
        </div>
      </AvalonScrollbars>
    );
  }
}

export default VoteHistory;
