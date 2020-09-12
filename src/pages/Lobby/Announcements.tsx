// External

import React from 'react'
import { Link } from 'react-router-dom'

// Internal

import AvalonScrollbars from '../../components/utils/AvalonScrollbars'

// Styles

import '../../styles/Lobby/Announcements.scss'

// Types

interface AnnouncementProps {
  date: string
  text: string
}

// Declaration

const Announcement = (props: AnnouncementProps) => {
  return (
    <p className="announcement">
      <span className="date">{props.date}</span>
      <Link to="/announcement">{props.text}</Link>
    </p>
  )
}

class Announcements extends React.PureComponent {
  render() {
    return (
      <div id="Announcements" className="row">
        <h3>
          <p>LATEST ANNOUNCEMENTS</p>
        </h3>
        <AvalonScrollbars>
          <Announcement date="7/11/2020" text="This is an announcement" />
          <Announcement
            date="2/28/2019"
            text="This is a larger announcement to test paragraph dimensions"
          />
          <Announcement
            date="2/28/2019"
            text="This is a larger announcement to test paragraph dimensions"
          />
          <Announcement
            date="2/28/2019"
            text="This is a larger announcement to test paragraph dimensions"
          />
        </AvalonScrollbars>
      </div>
    )
  }
}

export default Announcements
