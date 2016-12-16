import * as log from 'winston'
import _ from 'lodash'
import 'colors'

import {handleYargsError} from '../utils/util'

/**
 * Stores the modules that have been registered and registers them with yargs.
 */
class Registry {

  constructor() {
    this.modules = {};
  }

  /**
   * Registers a module with the registry.
   *
   * @param {object|Array.<object>} modules The module or modules to register.
   */
  register(modules) {
    if (modules && !_.isArray(modules)) {
      modules = [modules];
    }
    if (!modules || !modules.length) {
      log.debug("No modules provided to register");
      return;
    }

    _.each(modules, (module) => {
      log.debug(`Registering ${module.name} (${module.id})...`);
      this.modules[module.id] = module;
    });
  }

  /**
   * Registers a module with yargs as a command.
   *
   * @param module The module to register as a command.
   * @param yargs The yargs object to register the module with.
   */
  registerCommand(yargs, module) {
    yargs.command(module.id, module.description, (yargs) => {
    }, (argv) => {
      log.debug(`Command ${module.id.cyan} invoked with argv`, argv);
      this.globalArgv = argv;
      this.command(module, yargs, argv);
    });

    // Register aliases.
    // TODO(ladeo): Implement command aliases (yargs.alias is for options).
    //_.each(this.aliases, (alias) => yargs.alias(this.key, alias));
  }

  /**
   * Registers the methods of a module as actions (yargs subcommands).
   *
   * @param module The module to register the actions of.
   * @param yargs The yargs object to register the module with.
   * @param argv The argv object from invoking the module.
   */
  command(module, yargs, argv) {
    log.debug("Registering command actions...");

    if (module.command) {
      console.log("Got a command, sir!");
      yargs.command(module);
      yargs.argv._;
      return;
    }

    let methodSubCmds = this.getMethodActions(module);
    if (!methodSubCmds) {
      throw new Error(`${module.name} doesn't provide handler or override registerActions`.red);
    }

    this.registerMethodActions(module, yargs, methodSubCmds);

    yargs
      .usage(`Usage: $0 ${module.id.cyan} ${'<action>'.magenta}`)
      .demand(2, 'ERROR: Must provide an action\n'.red)
      .fail(handleYargsError(yargs));

    const [command, action, ...args] = yargs.argv._;
  }

  /**
   * Registers the module's action methods with yargs.
   *
   * @param {object} module The module to register actions for.
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
        log.debug(`Registering action ${key.magenta} on ${module.id.cyan}...`);
        yargs.command(key, desc, (yargs) => {
        }, (argv) => {
          yargs.fail(handleYargsError(yargs));
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
    return null;
  }

  /**
   * Combines the local argv of a command with whatever global (i.e. parent) argv has been stored.
   *
   * @param {?object} argv The local argv output of a child command.
   * @protected
   */
  _combineArgvs(argv) {
    return _.merge({}, this.globalArgv, argv);
  }

  registerAllCommands(yargs) {
    _.each(this.modules, this.registerCommand.bind(this, yargs));
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
