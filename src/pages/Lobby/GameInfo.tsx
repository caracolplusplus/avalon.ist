// External

import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

// Styles

import "../../styles/Utils/SettingsMenu.scss";

// Declaration

interface GameFormProps {
  onExit: (...args: any[]) => void;
}

interface GameFormState {
  playerMax: number;
  roleSettings: {
    merlin: boolean;
    percival: boolean;
    morgana: boolean;
    assassin: boolean;
    oberon: boolean;
    mordred: boolean;
    card: boolean;
  };
}

class GameForm extends React.PureComponent<GameFormProps, GameFormState> {
  constructor(props: GameFormProps) {
    super(props);
    this.state = {
      playerMax: 6,
      roleSettings: {
        merlin: true,
        percival: true,
        morgana: true,
        assassin: true,
        oberon: false,
        mordred: false,
        card: false,
      },
    };
  }

  render() {
    const roleArr = [];
    const cardArr = [];

    if (this.state.roleSettings.merlin) roleArr.push("Merlin");
    if (this.state.roleSettings.percival) roleArr.push("Percival");
    if (this.state.roleSettings.morgana) roleArr.push("Morgana");
    if (this.state.roleSettings.assassin) roleArr.push("Assassin");
    if (this.state.roleSettings.oberon) roleArr.push("Oberon");
    if (this.state.roleSettings.mordred) roleArr.push("Mordred");
    if (this.state.roleSettings.card) cardArr.push("Lady of the Lake");

    return (
      <div className="settings-form">
        <form autoComplete="off">
          <p className="title">GAME INFO</p>
          <p className="subtitle">Player Max</p>
          <div className="input-container">
            <p className="handle">{this.state.playerMax}</p>{" "}
          </div>
          <p className="subtitle">Roles</p>
          <div className="input-container">
            <p className="handle">{roleArr.toString().replace(/,/g, ", ")}</p>{" "}
          </div>
          <p className="subtitle">Cards</p>
          <div className="input-container">
            <p className="handle">{cardArr.toString().replace(/,/g, ", ")}</p>{" "}
          </div>
          <div className="buttons">
            <button
              className="bt-cancel"
              type="button"
              onClick={this.props.onExit}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </form>
      </div>
    );
  }
}

export default GameForm;
