import { h, useState, useEffect, useRef, useCallback } from '../imports';

import MonacoContainer from './MonacoContainer';

import { monaco, noop } from './utils';
const useMount = effect => useEffect(effect, []);
const useUpdate = (effect, deps, applyChanges = true) => {
  const isInitialMount = useRef(true);

  useEffect(
    isInitialMount.current || !applyChanges
      ? () => { isInitialMount.current = false; }
      : effect,
    deps
  );
};

const themes = {
  'night-dark': {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#202124'
    }
  }
};

const Editor = ({
  value,
  language,
  editorDidMount,
  theme,
  line,
  width,
  height,
  loading,
  options,
  overrideServices,
  _isControlledMode,
  className,
  wrapperClassName
}) => {
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isMonacoMounting, setIsMonacoMounting] = useState(true);
  const editorRef = useRef();
  const monacoRef = useRef();
  const containerRef = useRef();

  useMount(() => {
    const cancelable = monaco.init();

    cancelable
      .then(mEditor => (monacoRef.current = mEditor) && setIsMonacoMounting(false))
      .catch(error => error?.type !== 'cancelation' &&
        console.error('Monaco initialization: error:', error));

    return () => editorRef.current ? disposeEditor() : cancelable.cancel();
  });

  useUpdate(() => {
    editorRef.current.updateOptions(options);
  }, [options], isEditorReady);

  useUpdate(() => {
    if (editorRef.current.getOption(monacoRef.current.editor.EditorOption.readOnly)) {
      editorRef.current.setValue(value);
    } else if (value !== editorRef.current.getValue()) {
      editorRef.current.executeEdits('', [{
        range: editorRef.current.getModel().getFullModelRange(),
        text: value
      }]);

      if (_isControlledMode) {
        const model = editorRef.current.getModel();

        model.forceTokenization(model.getLineCount());
      }

      editorRef.current.pushUndoStop();
    }
  }, [value], isEditorReady);

  useUpdate(() => {
    // set last value by .setValue method before changing the language
    editorRef.current.setValue(value);
    monacoRef.current.editor.setModelLanguage(editorRef.current.getModel(), language);
  }, [language], isEditorReady);

  useUpdate(() => {
    editorRef.current.setScrollPosition({ scrollTop: line });
  }, [line], isEditorReady);

  useUpdate(() => {
    monacoRef.current.editor.setTheme(theme);
  }, [theme], isEditorReady);

  const createEditor = useCallback(() => {
    editorRef.current = monacoRef.current.editor.create(containerRef.current, {
      value,
      language,
      automaticLayout: true,
      ...options
    }, overrideServices);

    editorDidMount(editorRef.current.getValue.bind(editorRef.current), editorRef.current);

    monacoRef.current.editor.defineTheme('dark', themes['night-dark']);
    monacoRef.current.editor.setTheme(theme);

    setIsEditorReady(true);
  }, [editorDidMount, language, options, overrideServices, theme, value]);

  useEffect(() => {
    !isMonacoMounting && !isEditorReady && createEditor();
  }, [isMonacoMounting, isEditorReady, createEditor]);

  const disposeEditor = () => editorRef.current.dispose();

  return (
    <MonacoContainer
      width={width}
      height={height}
      isEditorReady={isEditorReady}
      loading={loading}
      _ref={containerRef}
      className={className}
      wrapperClassName={wrapperClassName}
    />
  );
};

Editor.defaultProps = {
  editorDidMount: noop,
  theme: 'light',
  width: '100%',
  height: '100%',
  loading: 'Loading...',
  options: {},
  overrideServices: {},
  _isControlledMode: false
};

export { Editor, themes };
export default Editor;