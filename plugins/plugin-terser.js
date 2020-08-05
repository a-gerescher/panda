const { minify } = require('terser');

const transform = (code, options) => minify(code, options).then(result => ({ result, nameCache: options.nameCache }));

function terser(userOptions = {}) {
  if (userOptions.sourceMap != null) {
    throw Error(
      'sourceMap option is removed. Now it is inferred from rollup options.'
    );
  }
  if (userOptions.sourcemap != null) {
    throw Error(
      'sourcemap option is removed. Now it is inferred from rollup options.'
    );
  }

  return {
    name: 'terser',

    async renderChunk(code, chunk, outputOptions) {


      const defaultOptions = {
        sourceMap:
          outputOptions.sourcemap === true ||
          typeof outputOptions.sourcemap === 'string'
      };
      if (outputOptions.format === 'es' || outputOptions.format === 'esm') {
        defaultOptions.module = true;
      }
      if (outputOptions.format === 'cjs') {
        defaultOptions.toplevel = true;
      }

      const normalizedOptions = { ...defaultOptions, ...userOptions };

      // remove plugin specific options
      for (let key of ['numWorkers']) {
        if (normalizedOptions.hasOwnProperty(key)) {
          delete normalizedOptions[key];
        }
      }


      try {
        const result = await transform(code, normalizedOptions);

        if (result.nameCache) {
          let { vars, props } = userOptions.nameCache;

          // only assign nameCache.vars if it was provided, and if terser produced values:
          if (vars) {
            const newVars =
              result.nameCache.vars && result.nameCache.vars.props;
            if (newVars) {
              vars.props = vars.props || {};
              Object.assign(vars.props, newVars);
            }
          }

          // support populating an empty nameCache object:
          if (!props) {
            props = userOptions.nameCache.props = {};
          }

          // merge updated props into original nameCache object:
          const newProps =
            result.nameCache.props && result.nameCache.props.props;
          if (newProps) {
            props.props = props.props || {};
            Object.assign(props.props, newProps);
          }
        }

        return result.result;
      } catch (error) {
        console.error(
          'Line:', error.line,
          'Column:', error.col,
          error.message
        );
        throw error;
      }
    }
  };
}

export { terser };