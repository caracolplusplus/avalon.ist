// External

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';
import AvalonScrollbars from './AvalonScrollbars';

// Styles

import '../../styles/Utils/ListInput.scss';

// Declaration

interface ObjectProps {
  onClick: (...args: any[]) => void;
  text: string;
}

interface ListProps {
  objects: ObjectProps[];
  onClick: (...args: any[]) => void;
  show: boolean;
  title: string;
}

const List = (props: ListProps) => {
  return (
    <div className="list">
      <button className={'list-button ' + props.show} onClick={props.onClick} type="button">
        <p>{props.title}</p>
        <FontAwesomeIcon icon={faCaretDown} />
      </button>
      {props.show ? (
        <div className="dropdown-wrapper">
          <AvalonScrollbars>
            <div className="dropdown-content">
              {props.objects.map((p, i) => (
                <button className="dropdown-item" key={'option' + i} onClick={p.onClick} type="button">
                  <p>{p.text}</p>
                </button>
              ))}
            </div>
          </AvalonScrollbars>
        </div>
      ) : null}
    </div>
  );
};

export default List;
