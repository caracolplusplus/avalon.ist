// External

import React from "react";
import { Route, Redirect } from "react-router-dom";

// Internal

import CustomRouteProps from "./custom-route-props";

// Declaration

const UnverifiedOnly = ({
  component: Component,
  authenticated,
  verified,
  ...rest
}: CustomRouteProps) => {
  return (
    <Route
      {...rest}
      render={(props) =>
        authenticated ? (
          !verified ? (
            <Component {...props} />
          ) : (
            <Redirect
              to={{ pathname: "/lobby", state: { from: props.location } }}
            />
          )
        ) : (
          <Redirect to={{ pathname: "/", state: { from: props.location } }} />
        )
      }
    />
  );
};

export default UnverifiedOnly;
