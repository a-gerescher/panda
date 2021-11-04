import { h, useState, useEffect, useRef, useCallback } from '../imports';

import loader from '@monaco-editor/loader';
import MonacoContainer from './MonacoContainer';

const config = {
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.28.1/min/vs',
  },
}


loader.config(config);

import { noop, getOrCreateModel, isUndefined  } from './utils';
const useMount = effect => useEffect(effect, []);
const useUpdate = (effect, deps) => {
  const isInitialMount = useRef(true);

  useEffect(
    isInitialMount.current
      ? _ => { isInitialMount.current = false }
      : effect,
    deps
  );
};

function usePrevious(value) {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

const viewStates = new Map();

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
  defaultValue,
  defaultLanguage,
  defaultPath,
  value,
  language,
  path,
  /* === */
  theme,
  line,
  loading,
  options,
  overrideServices,
  saveViewState,
  keepCurrentModel,
  /* === */
  width,
  height,
  className,
  wrapperProps,
  /* === */
  beforeMount,
  onMount,
  onChange,
  onValidate,
}) => {
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isMonacoMounting, setIsMonacoMounting] = useState(true);
  const monacoRef = useRef(null);
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const onMountRef = useRef(onMount);
  const beforeMountRef = useRef(beforeMount);
  const subscriptionRef = useRef(null);
  const valueRef = useRef(value);
  const previousPath = usePrevious(path);

  useMount(() => {
    const cancelable = loader.init();

    cancelable
      .then(monaco => ((monacoRef.current = monaco) && setIsMonacoMounting(false)))
      .catch(error => error?.type !== 'cancelation' &&
        console.error('Monaco initialization: error:', error));

    return () => editorRef.current ? disposeEditor() : cancelable.cancel();
  });

  useUpdate(() => {
    const model = getOrCreateModel(
      monacoRef.current,
      defaultValue || value,
      defaultLanguage || language,
      path,
    );

    if (model !== editorRef.current.getModel()) {
      saveViewState && viewStates.set(previousPath, editorRef.current.saveViewState());
      editorRef.current.setModel(model);
      saveViewState && editorRef.current.restoreViewState(viewStates.get(path));
    }
  }, [path], isEditorReady);

  useUpdate(() => {
    editorRef.current.updateOptions(options);
  }, [options], isEditorReady);

  useUpdate(() => {
    if (editorRef.current.getOption(monacoRef.current.editor.EditorOption.readOnly)) {
      editorRef.current.setValue(value);
    } else {
      if (value !== editorRef.current.getValue()) {
        editorRef.current.executeEdits('', [{
          range: editorRef.current.getModel().getFullModelRange(),
          text: value,
          forceMoveMarkers: true,
        }]);

        editorRef.current.pushUndoStop();
      }
    }
  }, [value], isEditorReady);

  useUpdate(() => {
    monacoRef.current.editor.setModelLanguage(editorRef.current.getModel(), language);
  }, [language], isEditorReady);

  useUpdate(() => {
    // reason for undefined check: https://github.com/suren-atoyan/monaco-react/pull/188
    if(!isUndefined(line)) {
      editorRef.current.revealLine(line);
    }
  }, [line], isEditorReady);

  useUpdate(() => {
    monacoRef.current.editor.setTheme(theme);
  }, [theme], isEditorReady);

  const createEditor = useCallback(() => {
    beforeMountRef.current(monacoRef.current);
    const autoCreatedModelPath = path || defaultPath;

    const defaultModel = getOrCreateModel(
      monacoRef.current,
      value || defaultValue,
      defaultLanguage || language,
      autoCreatedModelPath,
    );

    editorRef.current = monacoRef.current.editor.create(containerRef.current, {
      model: defaultModel,
      automaticLayout: true,
      ...options,
    }, overrideServices);

    saveViewState && editorRef.current.restoreViewState(viewStates.get(autoCreatedModelPath));

    monacoRef.current.editor.defineTheme('dark', themes['night-dark']);
    monacoRef.current.editor.setTheme(theme);

    setIsEditorReady(true);
  }, [
    defaultValue,
    defaultLanguage,
    defaultPath,
    value,
    language,
    path,
    options,
    overrideServices,
    saveViewState,
    theme,
  ]);

  useEffect(() => {
    if (isEditorReady) {
      onMountRef.current(
        editorRef.current,
        monacoRef.current,
      );
    }
  }, [isEditorReady]);

  useEffect(() => {
    !isMonacoMounting && !isEditorReady && createEditor();
  }, [isMonacoMounting, isEditorReady, createEditor]);

  // subscription
  // to avoid unnecessary updates (attach - dispose listener) in subscription
  valueRef.current = value;

  useEffect(() => {
    if (isEditorReady && onChange) {
      subscriptionRef.current?.dispose();
      subscriptionRef.current = editorRef.current?.onDidChangeModelContent(event => {
        const editorValue = editorRef.current.getValue();

        if (valueRef.current !== editorValue) {
          onChange(editorValue, event);
        }
      });
    }
  }, [isEditorReady, onChange]);

  // onValidate
  useEffect(() => {
    if (isEditorReady) {
      const changeMarkersListener = monacoRef.current.editor.onDidChangeMarkers(uris => {
        const editorUri = editorRef.current.getModel()?.uri;

        if (editorUri) {
          const currentEditorHasMarkerChanges = uris.find((uri) => uri.path === editorUri.path);
          if (currentEditorHasMarkerChanges) {
            const markers = monacoRef.current.editor.getModelMarkers({ resource: editorUri });
            onValidate?.(markers);
          }
        }
      });
   
      return () => {
        changeMarkersListener?.dispose();
      };
    }
  }, [isEditorReady, onValidate]);

  function disposeEditor() {
    subscriptionRef.current?.dispose();

    if (keepCurrentModel) {
      saveViewState && viewStates.set(path, editorRef.current.saveViewState());
    } else {
      editorRef.current.getModel()?.dispose();
    }

    editorRef.current.dispose();
  }

  return (
    <MonacoContainer
      width={width}
      height={height}
      isEditorReady={isEditorReady}
      loading={loading}
      _ref={containerRef}
      className={className}
      wrapperProps={wrapperProps}
    />
  );
}

Editor.defaultProps = {
  theme: 'light',
  width: '100%',
  height: '100%',
  loading: 'Loading...',
  options: {},
  overrideServices: {},
  saveViewState: true,
  keepCurrentModel: false,
  /* === */
  wrapperProps: {},
  /* === */
  beforeMount: noop,
  onMount: noop,
  onValidate: noop,
};

export { Editor, themes };
export default Editor;