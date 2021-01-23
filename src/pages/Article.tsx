// External

import React from 'react';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
// eslint-disable-next-line no-unused-vars
import { RouteComponentProps } from 'react-router';
// eslint-disable-next-line no-unused-vars
import { rootType } from '../redux/reducers';
import ReactMarkdown from 'react-markdown';
import Parse from '../parse/parse';

// Internal

import AvalonScrollbars from '../components/utils/AvalonScrollbars';
import Navbar from './Navbar';
import Announcements from './Lobby/Announcements';
import NewAvatars from './Lobby/NewAvatars';

// Styles

import '../styles/Lobby.scss';

interface Announcement {
  title: string;
  author: string;
  timestamp: number;
  content: string;
}

interface ArticleProps {
  url: string;
}

interface ArticleState {
  article: Announcement;
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

  state = {
    article: {
      title: '',
      content: '',
      author: '',
      timestamp: 0,
    },
    redirect: false,
  };
  mounted: boolean = true;

  componentDidMount() {
    const { url } = this.props.match.params;

    Parse.Cloud.run('generalCommands', { call: 'articleRequest', url }).then(
      this.onResponse
    );
  }

  componentWillUnmount = () => {
    this.mounted = false;
  };

  componentDidUpdate(prevProps: PageProps) {
    const { url } = this.props.match.params;
    const { url: prevUrl } = prevProps.match.params;

    if (url !== prevUrl) {
      Parse.Cloud.run('generalCommands', { call: 'articleRequest', url }).then(
        this.onResponse
      );
    }
  }

  onResponse = (article: Announcement) => {
    if (!this.mounted) return;

    if (!article) {
      this.onRedirect();
      return;
    }

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
