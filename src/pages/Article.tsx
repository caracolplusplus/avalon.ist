// External

import React from 'react';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
// eslint-disable-next-line no-unused-vars
import { RouteComponentProps } from 'react-router';
// eslint-disable-next-line no-unused-vars
import { rootType } from '../redux/reducers';
import ReactMarkdown from 'react-markdown';

// Internal

import socket from '../socket-io/socket-io';
import AvalonScrollbars from '../components/utils/AvalonScrollbars';
import Navbar from './Navbar';
import Announcements from './Lobby/Announcements';
import NewAvatars from './Lobby/NewAvatars';

// Styles

import '../styles/Lobby.scss';

interface ArticleProps {
  id: string;
}

interface ArticleState {
  article: any;
  redirect: boolean;
}

interface PageProps extends RouteComponentProps<ArticleProps> {
  style?: any;
}

const mapState = (state: rootType) => {
  const { style } = state;
  return { style };
};

// Declaration

class Article extends React.PureComponent<PageProps, ArticleState> {
  initialHeight = Math.max(window.innerHeight, 630);

  constructor(props: PageProps) {
    super(props);
    this.state = {
      article: null,
      redirect: false,
    };
  }

  componentDidMount() {
    socket.on('articleResponse', this.onResponse);
    socket.on('articleNotFound', this.onRedirect);

    socket.emit('articleRequest', this.props.match.params.id);
  }

  componentWillUnmount() {
    socket.off('articleResponse', this.onResponse);
    socket.off('articleNotFound', this.onRedirect);
  }

  componentDidUpdate(prevProps: PageProps) {
    if (this.props.match.params.id !== prevProps.match.params.id) {
      socket.emit('articleRequest', this.props.match.params.id);
    }
  }

  onResponse = (article: any) => {
    this.setState({ article });
  };

  onRedirect = () => {
    this.setState({ redirect: true });
  };

  render() {
    const theme = this.props.style.themeLight ? 'light' : 'dark';

    const articleFormat = '# {title}\n Written by {author} - Published {date}\n___\n';

    return this.state.redirect ? (
      <Redirect to="/article-not-found" />
    ) : (
      <div id="Background-2" className={'full ' + theme}>
        <Navbar username="" key={'Navbar'} />
        <AvalonScrollbars>
          <div
            id="Article"
            className="section"
            style={{ minHeight: this.initialHeight + 'px' }}
          >
            <div className="column section">
              <Announcements />
              <NewAvatars />
            </div>
            <div className="column section">
              <div className="row clean">
                <AvalonScrollbars>
                  <ReactMarkdown className="markdown">
                    {this.state.article
                      ? articleFormat
                          .replace(/{title}/, this.state.article.title)
                          .replace(/{author}/, this.state.article.author)
                          .replace(
                            /{date}/,
                            new Date(this.state.article.timestamp).toLocaleString('en-US')
                          ) + this.state.article.content
                      : ' '}
                  </ReactMarkdown>
                </AvalonScrollbars>
              </div>
            </div>
          </div>
        </AvalonScrollbars>
      </div>
    );
  }
}

export default connect(mapState, null)(Article);
