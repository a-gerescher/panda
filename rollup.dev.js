// Rollup plugins
import buble from 'rollup-plugin-buble'
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import sass from 'rollup-plugin-sass';

const isProduction = process.env.NODE_ENV === 'production';
const bundleType = process.env.mod || 'iife';
let terserConfig = {};
let outputs = [];

let iife = {
  file: 'build/bundle.js',
  format: 'iife',
  globals: { "window.preact": "preact" }
}

let esm = {
  file: 'build/bundle.esm.js',
  format: 'esm'
}

if(isProduction){
  terserConfig = {
    toplevel: true,
    compress: {
      warnings: false
    },
    mangle: {
      toplevel: true,
      properties: { regex: /^_/ }
    },
    output: {
      comments: false
    },
    sourcemap: false
  }

  if(bundleType === "iife") {
    outputs.push(iife)
  }

  if(bundleType === "esm") {
    outputs.push(esm);
    terserConfig.compress.ecma = 6;
    terserConfig.compress.unsafe_arrows = true;
    terserConfig.output.ecma = 6;
  }
} else {
  outputs = [iife,esm];
  terserConfig = {
    compress: {
      warnings: false
    },
    mangle: {
      properties: { regex: /^_/ }
    },
    output: {
      comments: false
    },
    sourcemap: false
  }
}

export default {
  input: 'src/app.js',
  output: outputs,
  external: ['preact'],
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
  plugins: [
    sass({
			output: 'build/css/style.css',
		}),
    buble({ exclude: 'node_modules/**', jsx: 'h' }),
    resolve({
      browser: true,
      extensions: ['.js', '.jsx']
    }),
    commonjs({
      include: 'node_modules/**',
      namedExports: {
        'node_modules/preact/src/component': ['Component'],
        'node_modules/preact/src/render': ['render'],
        'node_modules/preact/src/create-element': ['createElement','Fragment'],
      },
    }),
    replace({ 'process.env.NODE_ENV': JSON.stringify('development') }),
    terser(terserConfig),
    !isProduction && serve({
      // Multiple folders to serve from
      contentBase: ['build'],

      // Path to fallback page
      historyApiFallback: '/index.html',

      // Options used in setting up server
      host: 'localhost',
      port: 8001
    }),
    !isProduction && livereload({watch: 'build'})
  ]
};
