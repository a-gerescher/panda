import { Sidebar } from './components/sidebar';
import { h, render, Fragment, c, d as Part, useState, useRef, useEffect } from './imports';
import { MonacoEditor } from './components/monaco';
import marked from 'marked';

const MarkdownViewer = ({ text }) => {
  const [html, setHtml] = useState(text);

  useEffect(() => {
    setHtml(marked(text));
  }, [text]);

  return (
    <Part {...c('viewer')} dangerouslySetInnerHTML={{ __html: html }} />
  );
};

const ContentViewer = ({ text,setText }) => {
  return (
    <Part {...c('content')}>
      <MonacoEditor {...{ text,setText }} />
    </Part>
  );
};

const App = () => {
  const [text, setText] = useState('# Title\n\nWrite a new chapter.');
  return (
    <Part>
      <Sidebar />
      <Part {...c('Editor')}>
        <ContentViewer {...{ text,setText }} />
        <MarkdownViewer {...{ text }} />
      </Part>
    </Part>
  );
};


render(<App />, document.getElementById('demo'));
