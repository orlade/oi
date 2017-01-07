import * as log from 'winston';
import _ from 'lodash';
import 'colors';

import Module from './module';

/**
 * Stores the modules that have been registered and registers them with yargs.
 */
class Registry {

  /**
   * Creates a new registry.
   */
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
      log.debug('No modules provided to register');
      return;
    }

    _.each(modules, (module) => {
      // Ensure every registered module is an actual Module.
      if (module.constructor.name !== 'Module') {
        module = new Module(module);
      }
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
    log.debug(`Registering command module ${module.command.cyan}...`);
    yargs.command(module);
  }

  /**
   * Combines the local argv of a command with whatever global (i.e. parent)
   * argv has been stored.
   *
   * @param {?object} argv The local argv output of a child command.
   * @returns {object} The merged argv object.
   * @protected
   */
  _combineArgvs(argv) {
    return _.merge({}, this.globalArgv, argv);
  }

  /**
   * Creates a yargs command for each module in the registry.
   *
   * @param {object} yargs The yargs instance to register the commands with.
   */
  registerAllCommands(yargs) {
    log.debug(`Registering all ${_.size(this.modules)} modules...`);
    _.each(this.modules, this.registerCommand.bind(this, yargs));
  }

  /**
   * Returns the names of all registered modules.
   *
   * @return {string[]} The names of the registered modules.
   */
  get moduleNames() {
    return _.map(this.modules, (v) => v.name);
  }

  /**
   * Returns the IDs of all registered modules.
   *
   * @return {string[]} The IDs of the registered modules.
   */
  get moduleIds() {
    return _.keys(this.modules);
  }

}

// Singleton instance returned for every import.
const registry = new Registry();

export default registry;
