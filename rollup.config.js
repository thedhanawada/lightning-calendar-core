import { babel } from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const input = 'src/index.js';
const external = []; // No external dependencies - zero dependency goal!

export default [
  // ESM build
  {
    input,
    external,
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      resolve(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          ['@babel/preset-env', {
            targets: {
              // Support modern browsers + Salesforce Locker Service
              chrome: '90',
              firefox: '88',
              safari: '14',
              edge: '90'
            },
            modules: false
          }]
        ]
      })
    ]
  },

  // CommonJS build
  {
    input,
    external,
    output: {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: true
    },
    plugins: [
      resolve(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          ['@babel/preset-env', {
            targets: {
              chrome: '90',
              firefox: '88',
              safari: '14',
              edge: '90'
            },
            modules: false
          }]
        ]
      })
    ]
  },

  // Minified UMD build for browsers
  {
    input,
    external,
    output: {
      file: 'dist/lightning-calendar.min.js',
      format: 'umd',
      name: 'LightningCalendar',
      sourcemap: true
    },
    plugins: [
      resolve(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          ['@babel/preset-env', {
            targets: {
              chrome: '90',
              firefox: '88',
              safari: '14',
              edge: '90'
            },
            modules: false
          }]
        ]
      }),
      terser({
        compress: {
          pure_funcs: ['console.log'], // Remove console.logs in production
          drop_console: false, // Keep console.warn and console.error
        },
        mangle: {
          reserved: [] // Don't mangle any names for Locker Service compatibility
        }
      })
    ]
  }
];