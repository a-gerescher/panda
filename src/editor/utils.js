import { create as createState } from './state';
const defaultConfig = {
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.20.0/min/vs'
  }
};

const compose = (...fns) => x => fns.reduceRight((y, f) => f(y), x);
const merge = (target, source) => {
  Object.keys(source).forEach(key => {
    if (source[key] instanceof Object) target[key] && Object.assign(source[key], merge(target[key], source[key]));
  });

  return { ...target, ...source };
};
const CANCELATION_MESSAGE = {
  type: 'cancelation',
  msg: 'operation is manually canceled'
};
const makeCancelable = promise => {
  let hasCanceled_ = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    promise.then(val => hasCanceled_ ? reject(CANCELATION_MESSAGE) : resolve(val));
    promise.catch(reject);
  });

  return wrappedPromise.cancel = () => hasCanceled_ = true, wrappedPromise;
};
const noop = () => {};
const [getState, setState] = createState({
  config: defaultConfig,
  isInitialized: false,
  configScriptSrc: null,
  resolve: null,
  reject: null
});

const MONACO_INIT = 'monaco_init';

function createConfig({ src, ...config }) {
  setState(state => ({
    configScriptSrc: src,
    config: merge(
      state.config,
      validateConfig(config)
    )
  }));
}

function init() {
  const state = getState(({ isInitialized }) => ({ isInitialized }));

  if (!state.isInitialized) {
    if (window.monaco && window.monaco.editor) {
      return Promise.resolve(window.monaco);
    }

    document.addEventListener(MONACO_INIT, handleConfigScriptLoad);

    compose(
      injectScripts,
      createMonacoLoaderScript,
      createConfigScript
    )();

    setState({ isInitialized: true });
  }

  return makeCancelable(wrapperPromise);
}

function validateConfig(config) {
  if (config.urls) {
    informAboutDepreciation();
    return { paths: { vs: config.urls.monacoBase } };
  }

  return config;
}

function injectScripts(script) {
  return document.body.appendChild(script);
}

function createScript(src) {
  const script = document.createElement('script');
  return src && (script.src = src), script;
}

function handleConfigScriptLoad() {
  const state = getState(({ resolve }) => ({ resolve }));

  document.removeEventListener(MONACO_INIT, handleConfigScriptLoad);
  state.resolve(window.monaco);
}

function createMonacoLoaderScript(configScript) {
  const state = getState(({ config, reject }) => ({ config, reject }));

  const loaderScript = createScript(`${state.config.paths.vs}/loader.js`);
  loaderScript.onload = () => injectScripts(configScript);

  loaderScript.onerror = state.reject;

  return loaderScript;
}

function createConfigScript() {
  const state = getState(
    ({ configScriptSrc, config, reject }) => ({ configScriptSrc, config, reject })
  );

  const configScript = createScript();

  if (state.configScriptSrc) {
    // it will be helpfull in case of CSP, which doesn't allow
    // inline script execution
    configScript.src = state.configScriptSrc;
  } else {
    configScript.innerHTML = `
      require.config(${JSON.stringify(state.config)});
      require(['vs/editor/editor.main'], function() {
        document.dispatchEvent(new Event('monaco_init'));
      });
    `;
  }

  configScript.onerror = state.reject;

  return configScript;
}

function informAboutDepreciation() {
  console.warn(`Deprecation warning!
    You are using deprecated way of configuration.
    Instead of using
      monaco.config({ urls: { monacoBase: '...' } })
    use
      monaco.config({ paths: { vs: '...' } })
  `);
}

const wrapperPromise = new Promise((resolve, reject) => setState({ resolve, reject }));

const monaco = { init, config: createConfig };

export { compose, merge, makeCancelable, noop, monaco };