import * as log from 'winston'
import _ from 'lodash'
import 'colors'

import Module from 'module'
import {handleYargsError, fail } from '../utils/util'

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
    log.debug(`Registering command module ${module.command.cyan}`);
    yargs.command(module).fail(fail);
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
    log.debug(`Registering all ${_.size(this.modules)} modules...`);
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
