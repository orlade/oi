import * as log from 'winston'
import _ from 'lodash'
import 'colors'

/**
 * Stores the modules that have been registered.
 */
class Registry {

  constructor() {
    this.modules = {};
  }

  /**
   * Registers a module with the registry.
   *
   * @param module The module to register.
   */
  register(module) {
    log.debug(`Registering ${module.name} (${module.id})...`);
    this.modules[module.id] = module;
  }

  /**
   * Registers a module with yargs as a command.
   *
   * @param module
   * @param yargs
   */
  registerCommand(module, yargs) {
    yargs.command(module.id, module.description, (yargs, argv) => {
      log.debug(`Command ${module.id.cyan} invoked with argv`, argv);
      this.globalArgv = argv;
      this.command(module, yargs, argv);

      this.addOptions(yargs);
    });

    // Register aliases.
    // TODO(ladeo): Implement command aliases (yargs.alias is for options).
    //_.each(this.aliases, (alias) => yargs.alias(this.key, alias));
  }

  /**
   * Adds default options to yargs.
   *
   * @param yargs The yargs object to add options to.
   * @return The given yargs object.
   */
  addOptions(yargs) {
    return yargs
      .option('d', {
        alias: 'debug',
        'default': false,
        describe: 'Enable debug logging'
      })
      .option('o', {
        alias: 'offline',
        'default': false,
        describe: 'Run tasks in offline mode'
      })
      .help('help')
      .alias('h', 'help');
  }

  command(module, yargs, argv) {
    log.debug("Registering command actions...");

    let methodSubCmds = this.getMethodActions(module);
    if (!methodSubCmds) {
      throw new Error(`${module.name} doesn't provide handler or override registerActions`.red);
    }

    this.registerMethodActions(module, yargs, methodSubCmds);

    yargs.usage(`Usage: $0 ${module.id.cyan} ${'<action>'.magenta}`);

    const actions = _.keys(yargs.getCommandHandlers());
    const [command, action, ...args] = yargs.argv._;
    if (action == null || !(_.includes(actions, action))) {
      throw new Error(`ERROR: Must provide a valid action for ${module.id}\n`.red);
    }
  }

  /**
   * Registers the module's action methods with yargs.
   *
   * @param {object} yargs The yargs object.
   * @param {Object.<string, string>} methodMap A map of method names to register as commands to
   * descriptions of what they do.
   * @param {?string} group The mixin that the method came from.
   */
  registerMethodActions(module, yargs, methodMap, group) {
    if (group) {
      _.each(methodMap, (desc, key) => {
        methodMap[key] = `  ${desc}`
      });

      var keys = _.keys(methodMap);
      methodMap[keys[0]] = `(${group.green}) ${methodMap[keys[0]]}`;
    }

    _.each(methodMap, (desc, key) => {
      if (typeof desc === 'string') {
        yargs.command(key, desc, (yargs, argv) => {
          module._invoke(key, this._combineArgvs(argv));
        });
      } else {
        module.registerMethodActions(module, yargs, desc, key);
      }
    });
  }

  /**
   * Maps common Process method names to descriptions. The keys are the names of methods on the
   * handler object provided to the module.
   *
   * This hook can be overridden by Module subclasses to register actions without interacting
   * directly with yargs.
   *
   * Default behaviour if not overridden is to try to find a {@code _actions} field on the handler.
   */
  getMethodActions(module) {
    log.debug("Checking for tasks defined on handler");
    if (module._actions) {
      return module._actions;
    } else {
      log.debug("No _actions field found on handler")
    }
    //log.debug(`getMethodActions not implemented in ${this.name}`);
    return null;
  }

  /**
   * Combines the local argv of a command with whatever global (i.e. parent) argv has been stored.
   *
   * @param {?object} argv The local argv output of a child command.
   * @protected
   */
  _combineArgvs(argv) {
    return _.merge({}, this.globalArgv || {}, argv || {});
  }

  registerAllCommands(yargs) {
    _.each(this.modules, (module) =>  this.registerCommand(module, yargs));
  }

  get moduleNames() {
    return _.map(this.modules, (v) => v.name);
  }

  get moduleIds() {
    return _.keys(this.modules);
  }

}

// Singleton instance returned for every import.
const registry = new Registry();

export default registry;
