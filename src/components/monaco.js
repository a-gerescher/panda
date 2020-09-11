
import { h, render, Fragment, c, d as Part, useState, useRef, useEffect, useCallback } from '../imports';
import { Editor } from '../editor/ControlledEditor';

const MonacoEditor = ({ text,setText }) => {
  const [options, setOptions] = useState({
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    renderLineHighlight: 'none',
    selectOnLineNumbers: true,
    automaticLayout: true,
    wordWrap: 'bounded'
  });
  const [language] = useState('markdown');

  const [changeTimeout,setChangeTimeout] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const editorRef = useRef();

  function handleEditorDidMount(_, editor) {
    setIsEditorReady(true);
    editorRef.current = editor;
    // Now you can use the instance of monaco editor
    // in this component whenever you want
  }

  const debounce = useCallback(
    () => {

      clearTimeout(changeTimeout);
      setChangeTimeout(setTimeout(() => {
        setText(editorRef.current.getValue());
      }, 50));
    },
    [changeTimeout]
  );

  // const handleEditorChange = useCallback((event,value) => {
  //   setText(editorRef.current.getValue());
  // }, [isEditorReady]);

  return (
    <Editor
      height="calc( 100vh )"
      theme={'dark'}
      language={language}
      value={text}
      options={options}
      onChange={debounce}
      editorDidMount={handleEditorDidMount}
    />
  );
};

export { MonacoEditor };