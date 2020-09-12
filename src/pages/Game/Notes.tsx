// External

import React, { ChangeEvent, createRef } from "react";
import { Dispatch } from "redux";
import { connect } from "react-redux";

// Internal

import AvalonScrollbars from "../../components/utils/AvalonScrollbars";

import { rootType } from "../../redux/reducers";
import { addNotes } from "../../redux/actions";

// Styles

import "../../styles/Game/Notes.scss";

// Declaration

interface NoteProps {
  notes: string;
  dispatch: Dispatch;
}

const mapState = (state: rootType) => {
  const { notes } = state;
  return { notes };
};

class Notes extends React.PureComponent<NoteProps, {}> {
  textarea = createRef<HTMLTextAreaElement>();

  constructor(props: NoteProps) {
    super(props);
    this.autoSetHeight = this.autoSetHeight.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    this.autoSetHeight();
  }

  componentDidUpdate(prevProps: NoteProps) {
    if (prevProps.notes !== this.props.notes) this.autoSetHeight();
  }

  autoSetHeight() {
    const ta = this.textarea.current!;

    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }

  handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    this.props.dispatch(addNotes(event.target.value));
  }

  render() {
    return (
      <div id="Notes" className="row">
        <AvalonScrollbars>
          <textarea
            value={this.props.notes}
            ref={this.textarea}
            onChange={this.handleChange}
            spellCheck={false}
            placeholder="Write your notes here!"
          />
        </AvalonScrollbars>
      </div>
    );
  }
}

export default connect(mapState, null)(Notes);
