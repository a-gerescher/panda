
import { h, render, Fragment, c, d as Part, useState, useRef } from '../imports';
import { Editor } from '../editor/editor';

const MonacoEditor = () => {
  const [text, setText] = useState('# Title\n\nWrite a new chapter.');
  const [options, setOptions] = useState({
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    renderLineHighlight: 'none',
    selectOnLineNumbers: true,
    automaticLayout: true
  });
  const [language] = useState('markdown');
  const [isEditorReady, setIsEditorReady] = useState(false);
  const editorRef = useRef();

  function handleEditorDidMount(_, editor) {
    setIsEditorReady(true);
    editorRef.current = editor;
    // Now you can use the instance of monaco editor
    // in this component whenever you want
  }

  return (
    <Editor
      height="calc( 100vh )"
      theme={'dark'}
      language={language}
      value={text}
      options={options}
      editorDidMount={handleEditorDidMount}
    />
  );
};

export { MonacoEditor };