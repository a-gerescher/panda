import { existsSync, mkdirSync, writeFile } from 'fs';
import { dirname } from 'path';
import { createFilter } from '@rollup/pluginutils';
export default function css (options = {}) {
  const filter = createFilter(options.include || ['/**/*.css', '/**/*.scss', '/**/*.sass'], options.exclude);
  let dest = options.output;

  const styles = {};
  const prefix = options.prefix ? options.prefix + '\n' : '';
  let includePaths = options.includePaths || ['node_modules/'];
  includePaths.push(process.cwd());

  function compileToCSS(scss) {
    // Compile SASS to CSS
    if (scss.length) {
      includePaths = includePaths.filter((v, i, a) => a.indexOf(v) === i);
      try {
        const preferredSass = require('sass');
        const sass = options.sass || preferredSass;
        const result = sass.renderSync(Object.assign({
          data: prefix + scss,
          includePaths
        }, options));
        // Possibly process CSS (e.g. by PostCSS)
        if (typeof options.processor === 'function') {
          return options.processor(result.css.toString(), styles);
        }
        const preparedResult = { css: result.css.toString() };
        if (result.map){
          preparedResult.map = result.map.toString();
        }
        return preparedResult;
      } catch (e) {
        if (options.failOnError) {
          throw e;
        }
        console.log();
        console.log(red('Error:\n\t' + e.message));
        if (e.message.includes('Invalid CSS')) {
          console.log(green('Solution:\n\t' + 'fix your Sass code'));
          console.log('Line:   ' + e.line);
          console.log('Column: ' + e.column);
        }
        if (e.message.includes('node-sass') && e.message.includes('find module')) {
          console.log(green('Solution:\n\t' + 'npm install --save node-sass'));
        }
        if (e.message.includes('node-sass') && e.message.includes('bindings')) {
          console.log(green('Solution:\n\t' + 'npm rebuild node-sass --force'));
        }
        console.log();
      }
    }
  }

  return {
    name: 'scss',
    transform (code, id) {
      if (!filter(id)) {
        return;
      }

      // Add the include path before doing any processing
      includePaths.push(dirname(id));

      // Rebuild all scss files if anything happens to this folder
      // TODO: check if it's possible to get a list of all dependent scss files
      //       and only watch those
      if ('watch' in options) {
        const files = Array.isArray(options.watch) ? options.watch : [options.watch];
        files.forEach(file => this.addWatchFile(file));
      }

      // When output is disabled, the stylesheet is exported as a string
      if (options.output === false) {
        return Promise.resolve(compileToCSS(code)).then(scss => ({
          code: 'export default ' + JSON.stringify(scss.css),
          map: { mappings: '' }
        }));
      }

      // Map of every stylesheet
      styles[id] = code;

      return '';
    },
    generateBundle (opts, bundle) {

      for (const bundleKey of Object.keys(bundle)) {
        const bundleItem = bundle[bundleKey];
        if (Object.keys(bundleItem.modules).find((mod) => filter(mod))){
          delete bundle[bundleKey];
        }
      }

      // No stylesheet needed
      if (options.output === false) {
        return;
      }

      // Combine all stylesheets
      let scss = '';
      for (const id in styles) {
        scss += styles[id] || '';
      }

      const res = compileToCSS(scss);

      // Resolve if processor returned a Promise
      Promise.resolve(res).then(({ css,map }) => {
        // Emit styles through callback
        if (typeof options.output === 'function') {
          options.output(css, styles);
          return;
        }

        if (typeof css !== 'string') {
          return;
        }

        if (typeof dest !== 'string') {
          // Don't create unwanted empty stylesheets
          if (!css.length) {
            return;
          }

          // Guess destination filename
          dest = opts.dest || opts.file || 'bundle.js';
          if (dest.endsWith('.js')) {
            dest = dest.slice(0, -3);
          }
          dest = dest + '.css';
        }

        // Ensure that dest parent folders exist (create the missing ones)
        ensureParentDirsSync(dirname(dest));

        // Emit styles to file
        writeFile(dest, css, (err) => {
          if (opts.verbose !== false) {
            if (err) {
              console.error(red(err));
            } else if (css) {
              console.log(green(dest), getSize(css.length));
            }
          }
        });
        return;
      });
    }
  };
}

function red (text) {
  return '\x1b[1m\x1b[31m' + text + '\x1b[0m';
}

function green (text) {
  return '\x1b[1m\x1b[32m' + text + '\x1b[0m';
}

function getSize (bytes) {
  return bytes < 10000
    ? bytes.toFixed(0) + ' B'
    : bytes < 1024000
      ? (bytes / 1024).toPrecision(3) + ' kB'
      : (bytes / 1024 / 1024).toPrecision(4) + ' MB';
}

function ensureParentDirsSync (dir) {
  if (existsSync(dir)) {
    return;
  }

  try {
    mkdirSync(dir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      ensureParentDirsSync(dirname(dir));
      ensureParentDirsSync(dir);
    }
  }
}