// External

import React, { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";

// Internal

import AvalonScrollbars from "../components/utils/AvalonScrollbars";
import Button from "../components/utils/Button";
import { Input } from "../components/utils/Input";

import { signup } from "../components/auth/signup";

// Styles

import "../styles/Login.scss";

// Declaration

class Signup extends React.PureComponent<
  {},
  {
    error: string | null;
    username: string;
    email: string;
    password: string;
  }
> {
  constructor(props: {}) {
    super(props);
    this.state = {
      error: null,
      username: "",
      email: "",
      password: "",
    };
    this.handleUsernameChange = this.handleUsernameChange.bind(this);
    this.handleEmailChange = this.handleEmailChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleUsernameChange(event: ChangeEvent<HTMLInputElement>) {
    this.setState({
      username: event.target.value,
    });
  }

  handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    this.setState({
      email: event.target.value,
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
    signup(this.state.email, this.state.password, this.state.username, (err) =>
      this.setState({ error: err })
    );
  }

  render() {
    return (
      <div id="Background" className="dark full">
        <AvalonScrollbars>
          <div id="Signup" className="section">
            <form autoComplete="off" onSubmit={this.handleSubmit}>
              <div className="logo-big" />
              <div className="smoke" />
              <h1>THE RESISTANCE: AVALON</h1>
              <h2>WILL GOOD TRIUMPH OVER EVIL?</h2>
              <p>
                You are about to join <strong>avalon.ist.</strong> Enter your
                login information in the form below.
              </p>
              <p className="last">
                Upon completing this registration, you have agreed to follow the{" "}
                <Link to="/tou">terms of use.</Link>
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
                  placeholder="Email"
                  name="email"
                  type="email"
                  icon="envelope"
                  onChange={this.handleEmailChange}
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
                  text="Sign up"
                  onClick={undefined}
                  className=""
                />
                <p>
                  <Link to="/">Log In</Link>
                </p>
              </div>
            </form>
          </div>
        </AvalonScrollbars>
      </div>
    );
  }
}

export default Signup;
