// External

import React, { Component, ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";

// Internal

import AvalonScrollbars from "../components/utils/AvalonScrollbars";
import Button from "../components/utils/Button";
import { Input } from "../components/utils/Input";

import { login } from "../components/auth/login";

// Styles

import "../styles/Login.scss";

// Declaration

class Login extends Component<
  {},
  {
    error: string | null;
    username: string;
    password: string;
  }
> {
  constructor(props: {}) {
    super(props);
    this.state = {
      error: null,
      username: "",
      password: "",
    };
    this.handleUsernameChange = this.handleUsernameChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleUsernameChange(event: ChangeEvent<HTMLInputElement>) {
    this.setState({
      username: event.target.value,
    });
  }

  handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    this.setState({
      password: event.target.value,
    });
  }

  handleSubmit(event: FormEvent) {
    event.preventDefault();
    this.setState({ error: null });
    login(this.state.username, this.state.password, (err) =>
      this.setState({ error: err })
    );
  }

  render() {
    return (
      <div id="Background" className="dark full">
        <AvalonScrollbars>
          <div id="Login" className="section">
            <form autoComplete="off" onSubmit={this.handleSubmit}>
              <div className="logo-big" />
              <h1>THE RESISTANCE: AVALON</h1>
              <h2>WILL GOOD TRIUMPH OVER EVIL?</h2>
              <p>
                <strong>The Resistance: Avalon</strong> is a social deduction
                game created by Don Eskridge.
              </p>
              <p className="last">
                Based on Arthurian legend, the loyal servants of Arthur work
                together to find the members of the Resistance while protecting
                the identity of Merlin. The minions of Mordred attempt to sneak
                onto the Resistance team in order to deduce the identity of
                Merlin and assassinate him. Will the minions of Mordred kill
                Merlin, or will the loyal servants triumph over evil?
              </p>
              <p className="last">
                The game is free to play on this site, and always will be.
              </p>
              {this.state.error ? (
                <p className="error">Error: {this.state.error}</p>
              ) : null}
              <div className="glow" />
              <div className="after-glow">
                <Input
                  placeholder="Username"
                  name="username"
                  type="text"
                  icon="user"
                  onChange={this.handleUsernameChange}
                />
                <Input
                  placeholder="Password"
                  name="password"
                  type="password"
                  icon="lock"
                  onChange={this.handlePasswordChange}
                />
                <Button
                  type="submit"
                  text="Login"
                  onClick={undefined}
                  className=""
                />
                <p>
                  <Link to="/signup">Sign up</Link>
                </p>
              </div>
            </form>
          </div>
        </AvalonScrollbars>
      </div>
    );
  }
}

export default Login;
