import 'colors';
import registry from './registry';
import log from './logger';
import _ from 'lodash';
import moment from 'moment';
import {reportResult, getAllPublicPropertyNames, expandHome}
  from '../utils/util';

/**
 * Regular expression pattern matching ${configurationPlaceholder} strings.
 * @type {RegExp}
 */
const PLACEHOLDER_REGEX = /\$\{([^}]+)\}/g;

/**
 * A module maps a name onto a collection of actions, and registers itself with
 * Oi to list the available actions.
 */
export default class Module {
  /**
   * Creates a new module.
   *
   * @param {{id, command: string, description: string}} options
   */
  constructor(options) {
    if (!options.command) {
      throw Error('Module must be created with a command');
    }
    const id = options.command;

    const optionsJson = JSON.stringify(_.omit(options, 'parent'));
    log.debug(`Initializing module ${id.cyan} with ${optionsJson}...`);
    this.options = options;
    _.merge(this, options, {id});
    _.defaults(this, {
      name: id,
      command: id,
      describe: this.describe || this.description || `Perform ${id}`,
      config: {},
    });
    // Inherit the parent module's config.
    this.parent && _.merge(this.config, this.parent.config);

    if (this.actions) {
      this.builder = this._builder.bind(this);
    } else if (this.handler) {
      log.debug(`Decorating handler to be invoked with module hooks...`);
      const host = this.parent || this;
      if (this.command in host) {
        throw Error(`Command cannot shadow Module property ${this.command}`);
      }

      host[this.command] = this._decorateHandlerConfig(this.handler);
      this.handler = host._invoke.bind(host, this.command);
    } else {
      const publicProps = getAllPublicPropertyNames(options);
      const methodNames = _.without(publicProps, 'command', 'describe');
      if (!methodNames.length) {
        throw Error('No actions, handler or methods to use as subcommands');
      }
      log.debug(`No actions or handler, binding ${methodNames.length} ` +
        `methods as subcommands (${methodNames.join(', ')})...`);
      this.actions = _.zipObject(methodNames, methodNames.map((command) => ({
        command,
        describe: `Performs ${command}`,
        handler: this._invoke.bind(this, command),
      })));
      this.builder = this._builder.bind(this);
    }
  }

  /**
   * Evaluates the final value of an option in the module's local configuration.
   * If the local configuration values contain ${placeholder} strings, they are
   * replaced with the named values from the parent/global configuration.
   *
   * @param {object} options The configuration object.
   * @param {string} key The key to update in options with values from local
   * configuration (if available).
   * @return {string} The updated value if substitutions were applied, or the
   * original value if there were no changes to be made.
   * @protected
   */
  _substituteConfig(options, key) {
    if (!this.config || !(key in this.config)) return options[key];

    const value = this.config[key];
    if (typeof value !== 'string') {
      log.debug(`Substituting non-string variable ${key.cyan} not supported`);
      return options[key];
    }

    const newValue = expandHome(
        value.replace(PLACEHOLDER_REGEX, (_, key) => options[key]));
    if (newValue !== value) {
      log.debug(`Substituting ${this.command} config ${key.cyan}: ` +
        `${value} => ${newValue}`);
    }
    return newValue;
  }

  /**
   * Decorates a handler function with logic to substitute global/parent conf
   * guration values into local configuration placeholders before running.
   *
   * @param {Function} handler The handler function to decorate.
   * @return {Function} The decorated handler function. This should be used the
   * same as if it had not been decorated.
   * @protected
   */
  _decorateHandlerConfig(handler) {
    return (name, options) => {
      const substitute = (value, key) => this._substituteConfig(options, key);
      options = _.merge(
          _.mapValues(options, substitute),
          _.mapValues(this.config, substitute)
      );
      return handler.call(this, name, options);
    };
  }

  /**
   * Yargs builder function.
   *
   * @param {object} yargs The Yargs object.
   * @param {object[]} actions Optional list of actions. Defaults to
   * this.actions.
   * @protected
   */
  _builder(yargs, actions) {
    actions = actions || this.actions;
    log.debug(`Building subcommands [${_.keys(actions).join(', ')}]...`);
    _.keys(actions).map(this._buildSubmodule, this).forEach(yargs.command);
    this.handler || yargs.demandCommand(1).strict();
  }

  /**
   * Creates a Module for a subcommand of this module.
   *
   * @param {string} subcommand The action of the new module.
   * @return {object} the new Module.
   * @protected
   */
  _buildSubmodule(subcommand) {
    return new Module(_.merge({
      command: subcommand,
      parent: this,
      config: this.config,
      requireConfig: this.requireConfig,
      requireTools: this.requireTools,
    },
    this.actions[subcommand]
    ));
  }

  /**
   * Invokes a method with some scaffolding.
   *
   * @param {string} methodName The name of the method on the task runner to
   * invoke.
   * @param {object} argv The command line arguments parsed by yargs, to be
   * applied to the method.
   * @return {string} The result of running the task.
   * @protected
   */
  _invoke(methodName, argv) {
    const [, ...args] = argv._;
    const kwargs = _.pickBy(argv, (p) => p !== '_');
    log.debug(`Invoking ${methodName.magenta} on ${this.id.cyan} ` +
      `with args ${args}, ${JSON.stringify(kwargs)}...`);
    return this.runTask(methodName, args.concat([kwargs]));
  }

  /**
   * Hook that runs before a task method is run when invoked through the runTask
   * method.
   *
   * @param {string} task The name of the task being run.
   * @param {object} args The arguments to be passed to the method.
   */
  beforeTask(task, args) {
    this.startTime = moment();
  }

  /**
   * Runs a task (by method name or function) between the before and after
   * hooks.
   *
   * @param {string|function} task The task to run.
   * @param {?Array.<object>} args The arguments to apply to the task.
   * @return {object} The result of running the task.
   */
  runTask(task, args) {
    if (this.beforeTask(task, args)) {
      return false;
    }
    log.debug(`Applying task ${task.magenta} to ${this.name.cyan}...`);
    const result = this[task](...args);
    // TODO(ladeo): Handle async invocation.
    this.afterTask(task, result);
    return result;
  }

  /**
   * Hook that runs after the completion of a task run through the runTask
   * method.
   *
   * @param {string} task The name of the task that just finished running.
   * @param {object} result The output of the completed task.
   * @return {*} Some output object that can be used to determine the success of
   * the task.
   */
  afterTask(task, result) {
    return this._report(task, result);
  }

  /**
   * Logs the result of running a task.
   *
   * @param {string} task The name of the task being run.
   * @param {object} result The result object from <code>shelljs.exec</code>.
   * @return {object} The result that was passed in.
   * @protected
   */
  _report(task, result) {
    const time = moment.duration(moment().diff(this.startTime));
    if (this.parent) {
      task = `${this.parent.command} ${task}`;
    }
    reportResult(task, result, time);
    return result;
  }

  /**
   * Registers the module with the singleton registry.
   */
  register() {
    registry.register(this);
  }
}
