import fs from 'fs'
import _ from 'lodash'
import * as log from 'winston'

import registry from '../core/registry'
import PluginScanner from '../core/plugin_scanner'

import Oi from '../modules/oi'
import noi from '../modules/noi'
import poi from '../modules/poi'

const yargs = require('yargs');

yargs.command({
  command: 'a',
  describe: 'a',
  builder: (y) => y.command({
    command: 'b',
    describe: 'b',
    builder: (yy) => yy.command({
      command: 'c',
      describe: 'c',
      handler: (ca) => console.log(ca)
    })
  })
}).help();
yargs.argv._;
//process.exit(0);

// Extends the String prototype with color commands.
import 'colors'

import JsonFile from '../utils/json_file'
import {loadConfig, handleYargsError} from '../utils/util'

// The path to the directory where global node modules are installed.
const GLOBAL_NODE_ROOT = '/usr/local/lib/node_modules';

// Follow links and expand parent dirs to find the package.json of this script.
const packagePath = fs.realpathSync(`${fs.realpathSync(process.argv[1])}/../../package.json`);

// Set up the logger with debug level if requested.
log.cli();
const debug = _.includes(process.argv, '-d') || _.includes(process.argv, '--debug');
// Use require to workaround importing issue (https://github.com/winstonjs/winston/issues/801)
require('winston').level = debug ? 'debug' : 'info';
log.debug(`Initialised log with level ${log.level}`);



// Initialise yargs for command line parsing.
yargs
  .usage(`Usage: $0 ${'<command>'.cyan} ${'<action>'.magenta} [options]`)
  .version(new JsonFile(packagePath).read().version).alias('v', 'version')
  // Merge configuration into the yargs options.
  .config('config', loadConfig).alias('c', 'config').default('config', '~/.oi/config.json')
  .option('d', {
    alias: 'debug',
    'default': false,
    describe: 'Enable debug logging'
  })
  .recommendCommands()
//.fail(handleYargsError(yargs));

// Generate the help after everything is registered.

new PluginScanner(GLOBAL_NODE_ROOT).loadPlugins((err, pluginModules) => {
  if (err) {
    log.debug("Failed to load plugins");
  } else {
    // Register any loaded plugin modules.
    registry.register(pluginModules);
  }

  // Register the Oi module.
  new Oi().register();
  yargs.command(noi);
  yargs.command(poi);

  // Register the commands of each module in the registry with yargs.
  registry.registerAllCommands(yargs);

  yargs
    .demand(1, 'ERROR: Must provide a command\n'.red).strict()
    .help('help').alias('h', 'help');

  // Commands will be automatically invoked when yargs.argv is calculated.
  // Before triggering them, we take a snapshot of the available commands. After commands are
  // evaluated we use the snapshot to determine if any commands were matched. If not, we can dig a
  // little deeper.
  const argv = yargs.argv;
  const [command, ] = argv._;
  const commands = registry.moduleIds;
  log.debug('Command', command);
  if (!_.includes(commands, command)) {
    //console.log(yargs.help());
    //yargs.showHelp();
    //log.error(`ERROR: Must provide a valid command\n`.red);
    //process.exit(1);
  }
});

