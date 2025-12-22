import { babel } from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const config = {
  input: 'src/index.js',
  external: ['@lightning-calendar/core'],
  output: [
    {
      file: 'dist/index.esm.js',
      format: 'es'
    },
    {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      exports: 'named'
    }
  ],
  plugins: [
    resolve(),
    babel({
      babelHelpers: 'bundled',
      presets: ['@babel/preset-env']
    }),
    terser()
  ]
};

export default config;