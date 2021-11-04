// Rollup plugins

import copy from './plugins/plugin-cpydir';
import { esbuild } from './plugins/plugin-esbuild';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from './plugins/plugin-terser';
import cleaner from './plugins/plugin-cleaner';
import { html, makeHtmlAttributes } from './plugins/plugin-html';
import scss from './plugins/plugin-scss';

const isProduction = process.env.NODE_ENV === 'production';
let terserConfig = {
  "compress": true,
  "mangle": {
    "toplevel" : true,
    "reserved": ["h","render","Fragment","useState","useEffect","useCallback","useRef"],
    "properties": {
      "regex": "/^__/"
    }
  },
  "output": {
    "comments": false
  },
  "toplevel": true,
  "ecma": 2020
};


let input = ['src/app.js','src/styles.scss'];

let esm = {
  dir: 'build',
  format: 'esm',
  hoistTransitiveImports: true,
  interop: true,
  paths: {
    'preact': './preact.js',
    'preact/compat': './compat.js',
    'preact/hooks': './hooks.js'
  },
  manualChunks: (id) => {
    let chunkPath = id;
    if (!isProduction && chunkPath.indexOf('node_modules')>=0) {
      return 'vendor';
    }
    if (!isProduction && chunkPath.indexOf('web_modules')>=0) {
      return 'vendor';
    }
    if (!isProduction && chunkPath.indexOf('service')>=0) {
      return 'service';
    }
  },
  minifyInternalExports: isProduction ? true : false,
  chunkFileNames: '[name].js'
}

let externals = ['preact','preact/hooks'];

if(!isProduction){
  input.push(
    'web_modules/preact.js',
    'web_modules/compat.js',
    'web_modules/hooks.js',
    'src/editor/editor.js'
  );
}


const template = ({ attributes, files, publicPath }) => {
  const scripts = (files.js || [])
        .map(({ code, fileName }) => {
          if( code === '\n') return null;
          return `<script src="${publicPath}${fileName}" ${makeHtmlAttributes(attributes.script).trim()}></script>`;
        })
        .join('')
  return `<!doctype html><html><head><meta charset="utf-8"><meta name=viewport content="width=device-width, initial-scale=1"><title>Panda</title><base href="/"><link rel="stylesheet" href="${isProduction ? 'layout.css':'./layout.css'}"></head><body><div id="demo"></div>${scripts}</body></html>`
}

let copyFiles = [];

copyFiles.push(

//  { files: 'src/assets/*.png', dest: esm.dir + '/assets' },
//  { files: 'src/assets/*.svg', dest: esm.dir + '/assets' },
//  { files: 'src/assets/fonts/*.woff', dest: esm.dir + '/assets' },
  { files: 'web_modules/*.js', dest: esm.dir },
  { files: 'web_modules/*.css', dest: esm.dir }
)


export default {
  input: input,
  output: [esm],
  external: externals,
  treeshake: isProduction,
  onwarn: (warning)=>{
    const ignoredCircular = [
      'preact',
    ];
    if (
      warning.code === 'CIRCULAR_DEPENDENCY' &&
      ignoredCircular.some(d => warning.importer.includes(d))
    ) {
      return;
    }
    console.warn(warning.message)
  },
  watch: {
    include: ['src/**/*'],
    clearScreen: false
  },
  plugins: [
    isProduction && cleaner({
      targets: [
        'build'
      ]
    }),
    resolve({
      exclude: ['node_modules/**','web_modules/**'],
      mainFields: ['module','main','browser'],
      extensions: ['.js', '.jsx']
    }),
    esbuild({
      include: 'src/**/*.js',
      target: 'es2018',
      jsxFactory: 'h',
      jsxFragment: 'Fragment',
      loader: 'jsx'
    }),
    copy(copyFiles),

    isProduction && terser(terserConfig),
    scss({
      output: esm.dir + '/layout.css',
      outputStyle: 'compressed',
      watch: 'src/styles.scss'
    }),
    html({
      'template': template,
      publicPath: './'
    })
  ]
};
