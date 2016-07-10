import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/bin/oi.js',
  dest: 'dist/oi.js',
  format: 'umd',
  globals: {
    child_process: 'child_process',
    colors: 'colors',
    'expand-home-dir': 'expandHomeDir',
    fs: 'fs',
    moment: 'moment',
    readline: 'readline',
    shelljs: 'shelljs',
    touch: 'touch',
    winston: 'log$1',
    lodash: '_',
    'universal-mixin': 'universal-mixin',
    path: 'path',
    'js-plugins': 'PluginManager'
  },

  // Transpile any ES2015 in the output file.
  plugins: [babel()],

  // Make the output executable.
  banner: '#!/usr/bin/env node'
};
