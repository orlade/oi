#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
const log = require('winston');
require('colors');

import PluginScanner from '../core/plugin_scanner';
import registry from '../core/registry';
import JsonFile from '../utils/json_file';
import * as utils from '../utils/util';


// The path to the directory where global node modules are installed.
const GLOBAL_NODE_ROOT = process.execPath
  .replace(/bin\/node$/, 'lib/node_modules');

// Follow links and expand parent dirs to find the package.json of this script.
const binDir = path.dirname(fs.realpathSync(process.argv[1]));
const packagePath = fs.realpathSync(`${binDir}/../../package.json`);

const includes = (arr, x) => arr.indexOf(x) !== -1;

// Set up the logger with debug level if requested.
log.cli();
const debug = includes(process.argv, '-d') || includes(process.argv, '--debug');
// Use require to workaround importing issue.
// See https://github.com/winstonjs/winston/issues/801
log.level = debug ? 'debug' : 'info';
log.debug(`Initialised log with level ${log.level.cyan}`);

// Initialise yargs for command line parsing.
yargs
  .usage(`Usage: $0 ${'<command>'.cyan} ${'<action>'.magenta} [options]`)
  .version(new JsonFile(packagePath).read().version).alias('v', 'version')
  // Merge configuration into the yargs options.
  .config('config', utils.loadConfig)
  .alias('c', 'config')
  .default('config', '~/.oi/config.json')
  .option('d', {
    'alias': 'debug',
    'default': false,
    'describe': 'Enable debug logging',
  })
  .global('d')
  .global('c')
  .recommendCommands();

// Generate the help after everything is registered.

new PluginScanner(GLOBAL_NODE_ROOT).loadPlugins((err, pluginModules) => {
  if (err) {
    log.debug('Failed to load plugins');
  } else {
    // Register any loaded plugin modules.
    registry.register(pluginModules);
  }

  // Register the commands of each module in the registry with yargs.
  registry.registerAllCommands(yargs);

  log.debug('Generating help');
  yargs
    .demand(1, 'ERROR: Must provide a command\n'.red)
    .fail(utils.fail)
    .help('help').alias('h', 'help');

  log.debug('Invoking yargs processing...');
  yargs.argv;
});

