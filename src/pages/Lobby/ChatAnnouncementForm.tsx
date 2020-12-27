// External

// eslint-disable-next-line no-unused-vars
import React, { ChangeEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';

// Internal

import AvalonScrollbars from '../../components/utils/AvalonScrollbars';
import Button from '../../components/utils/Button';

// Styles

import '../../styles/Utils/SettingsMenu.scss';

// Types

interface SelectablePlayerListProps {
  onSelect: (...args: any[]) => void;
  onExit: (...args: any[]) => void;
}

interface SelectablePlayerListState {
  id: string;
  title: string;
  content: string;
}

class SelectablePlayerList extends React.PureComponent<
  SelectablePlayerListProps,
  SelectablePlayerListState
> {
  state = {
    id: '',
    title: '',
    content: '',
  };

  onClick = () => {
    const { id, title, content } = this.state;

    if (id.length < 1 || title.length < 1 || content.length < 1) return;

    this.props.onSelect(this.state);
    this.props.onExit();
  };

  handleID = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ id: event.target.value });
  };

  handleTitle = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ title: event.target.value });
  };

  handleContent = (event: ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ content: event.target.value });
  };

  render() {
    return (
      <div className="settings-form">
        <AvalonScrollbars>
          <form autoComplete="off">
            <p className="title">Make a new announcement</p>
            <p className="subtitle">Post ID</p>
            <input
              type="text"
              placeholder="ID"
              value={this.state.id}
              name="id"
              onChange={this.handleID}
            />
            <p className="subtitle">Post Title</p>
            <input
              type="text"
              placeholder="Title"
              value={this.state.title}
              name="title"
              onChange={this.handleTitle}
            />
            <p className="subtitle">Post Contents</p>
            <textarea
              value={this.state.content}
              onChange={this.handleContent}
              spellCheck={false}
              placeholder="Write the contents of the announcement here."
            />
            <p className="subtitle">Announcement Preview</p>
            <div className="md-contain">
              <AvalonScrollbars>
                <ReactMarkdown className="markdown">{this.state.content}</ReactMarkdown>
              </AvalonScrollbars>
            </div>
            <div className="buttons">
              <button className="bt-cancel" type="button" onClick={this.props.onExit}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
              <Button className="" type="button" text="Post" onClick={this.onClick} />
            </div>
          </form>
        </AvalonScrollbars>
      </div>
    );
  }
}

export default SelectablePlayerList;
