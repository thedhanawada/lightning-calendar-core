import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default [
  // Browser-compatible ES module build
  {
    input: 'core/index.js',
    output: {
      file: 'demo/dist/calendar-core.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      nodeResolve()
    ]
  },
  // Minified version
  {
    input: 'core/index.js',
    output: {
      file: 'demo/dist/calendar-core.esm.min.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      terser()
    ]
  },
  // UMD build for script tag usage
  {
    input: 'core/index.js',
    output: {
      file: 'demo/dist/calendar-core.umd.js',
      format: 'umd',
      name: 'CalendarCore',
      sourcemap: true
    },
    plugins: [
      nodeResolve()
    ]
  }
];