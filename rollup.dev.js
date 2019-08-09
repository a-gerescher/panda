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

export default {
  input: 'src/app.js',
  output: [{
    file: 'build/bundle.js',
    format: 'iife'
  },{
    file: 'build/bundle.esm.js',
    format: 'esm'
  }],
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
        'node_modules/preact/dist/preact.js': ['h', 'render', 'Component', 'cloneElement', 'options'],
      },
    }),
    replace({ 'process.env.NODE_ENV': JSON.stringify('development') }),
    isProduction && terser({
      toplevel: true,
      compress: {
        passes: 3,
        //ecma: 6,
        //unsafe_arrows: true,
        warnings: false
      },
      mangle: {
        toplevel: true,
        properties: { regex: /^_/ }
      },
      output: {
        //ecma: 6,
        comments: false
      },
      sourcemap: false
    }),
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
