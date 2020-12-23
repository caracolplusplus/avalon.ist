// External

import React from 'react'
import { RouteProps, RouteComponentProps } from 'react-router-dom'

// Declaration

interface CustomRoute extends RouteProps {
  component:
    | React.ComponentType<RouteComponentProps<any>>
    | React.ComponentType<any>
  authenticated?: boolean
  verified?: boolean
}

type CustomRouteProps = CustomRoute

export default CustomRouteProps
