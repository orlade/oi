import fs from 'fs'
import _ from 'lodash'
import * as log from 'winston'

const yargs = require('yargs');

// Extends the String prototype with color commands.
import 'colors'

import JsonFile from '../utils/json_file'
import {loadConfig} from '../utils/util'

// Follow links and expand parent dirs to find the package.json of this script.
const packagePath = fs.realpathSync(`${fs.realpathSync(process.argv[1])}/../../package.json`);

// Initialise yargs for command line parsing.
yargs
    .usage(`Usage: $0 ${'<command>'.cyan} ${'<action>'.magenta} [options]`)
    .option('d', {
      alias: 'debug',
      'default': false,
      describe: 'Enable debug logging'
    })
    .version(new JsonFile(packagePath).read().version)
    .alias('v', 'version');


// Set up the logger with debug level if requested.
log.cli();
// Use require to workaround importing issue (https://github.com/winstonjs/winston/issues/801)
const earlyArgv = yargs.argv;
require('winston').level = earlyArgv.debug ? 'debug' : 'info';
log.debug(`Initialised log with level ${log.level}`);
log.debug(`Received argv: ${JSON.stringify(earlyArgv)}`);

// Register the modules.
import registry from '../core/registry'
import Foo from '../modules/foo'

new Foo().register();

// Merge configuration into the yargs properties.
yargs
    .config('config', loadConfig)
    .alias('c', 'config')
    .default('config', '~/.oi');

registry.registerAllCommands(yargs);

// Generate the help after everything is registered.
yargs
    .demand(1, 'ERROR: Must provide one of the commands above.\n'.red)
    .help('help')
    .alias('h', 'help');

// Commands will be automatically invoked when yargs.argv is calculated.
// Before triggering them, we take a snapshot of the available commands. After commands are
// evaluated we use the snapshot to determine if any commands were matched. If not, we can dig a
// little deeper.
const argv = yargs.argv;
const [command, ] = argv._;
const commands = registry.moduleIds;
if (!_.includes(commands, command)) {
  console.log(yargs.help());
  log.error(`ERROR: Must provide a valid command\n`.red);
  process.exit(1);
}
