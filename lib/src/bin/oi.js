#!/usr/bin/env node
import fs from 'fs'
import yargs from 'yargs'

const log = require('winston');

import PluginScanner from '../core/plugin_scanner'
import registry from '../core/registry'
import JsonFile from '../utils/json_file'
import * as utils from '../utils/util'

// Extends the String prototype with color commands.
require('colors');

// The path to the directory where global node modules are installed.
var GLOBAL_NODE_ROOT = process.execPath.replace(/bin\/node$/, 'lib/node_modules');

// Follow links and expand parent dirs to find the package.json of this script.
var packagePath = fs.realpathSync(`${fs.realpathSync(process.argv[1])}/../../../package.json`);

var includes = (arr, x) => arr.indexOf(x) !== -1;

// Set up the logger with debug level if requested.
log.cli();
var debug = includes(process.argv, '-d') || includes(process.argv, '--debug');
// Use require to workaround importing issue (https://github.com/winstonjs/winston/issues/801)
log.level = debug ? 'debug' : 'info';
log.debug(`Initialised log with level ${log.level}`);

// Initialise yargs for command line parsing.
yargs
  .usage(`Usage: $0 ${'<command>'.cyan} ${'<action>'.magenta} [options]`)
  .version(new JsonFile(packagePath).read().version).alias('v', 'version')
  // Merge configuration into the yargs options.
  .config('config', utils.loadConfig)
  .alias('c', 'config')
  .default('config', '~/.oi/config.json')
  .option('d', {
    alias: 'debug',
    'default': false,
    describe: 'Enable debug logging'
  })
  .global('d')
  .global('c')
  .recommendCommands();

// Generate the help after everything is registered.

new PluginScanner(GLOBAL_NODE_ROOT).loadPlugins((err, pluginModules) => {
  if (err) {
    log.debug("Failed to load plugins");
  } else {
    // Register any loaded plugin modules.
    registry.register(pluginModules);
  }

  // Register the commands of each module in the registry with yargs.
  registry.registerAllCommands(yargs);

  log.debug('Generating help');
  yargs
    .demand(1, 'ERROR: Must provide a command\n'.red).strict()
    .fail(utils.fail)
    .help('help').alias('h', 'help');

  // Commands will be automatically invoked when yargs.argv is calculated.
  // Before triggering them, we take a snapshot of the available commands. After commands are
  // evaluated we use the snapshot to determine if any commands were matched. If not, we can dig a
  // little deeper.
  var argv = yargs.argv;
  var [command, ] = argv._;
  var commands = registry.moduleIds;
  if (!includes(commands, command)) {
    //console.log(yargs.help());
    //yargs.showHelp();
    //log.error(`ERROR: Must provide a valid command\n`.red);
    //process.exit(1);
  }
});

