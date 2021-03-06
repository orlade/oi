#!/usr/bin/env node
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import log from '../core/logger';
require('colors');

import PluginScanner from '../core/plugin_scanner';
import registry from '../core/registry';
import JsonFile from '../utils/json_file';
import * as utils from '../utils/util';

// Set up the logger with debug level if requested.
const debugFlags = ['-d', '--debug'];
const debug = _.some(debugFlags, (flag) => _.includes(process.argv, flag));
// Use require to workaround importing issue.
// See https://github.com/winstonjs/winston/issues/801
log.level = debug ? 'debug' : 'info';
log.debug(`Initialised log with level ${log.level.cyan}`);

// The path to the directory where global node modules are installed.
const GLOBAL_NODE_ROOT =
    process.execPath.replace('bin/node', 'lib/node_modules');

// Follow links and expand parent dirs to find the package.json of this script.
const binDir = path.dirname(fs.realpathSync(process.argv[1]));
const packagePath = fs.realpathSync(`${binDir}/../../package.json`);
const version = new JsonFile(packagePath).read().version;

// Initialise yargs for command line parsing.
yargs
    .usage(`Usage: $0 ${'<command>'.cyan} ${'<action>'.magenta} [options]`)
    .version(version).alias('v', 'version')
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
    .option('completion');

// Scan for plugins that will register as yargs commands.
new PluginScanner({
  paths: GLOBAL_NODE_ROOT,
  host: {version, log},
}).loadPlugins((err, pluginModules) => {
  if (err) {
    log.info('Failed to load plugins');
  } else {
    // Register any loaded plugin modules.
    registry.register(pluginModules);
  }

  // Register the commands of each module in the registry with yargs.
  registry.registerAllCommands(yargs);

  // Generate the help after everything is registered.
  log.debug('Generating help');
  yargs
      .demandCommand(1, 'Must provide a command'.red)
      .strict()
      .fail(utils.fail)
      .help().alias('h', 'help')
      .completion();

  log.debug('Invoking yargs processing...');
  yargs.argv;
});
