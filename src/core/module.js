import registry from './registry'
import * as log from 'winston'
import _ from 'lodash'
import moment from 'moment'
import {reportResult} from '../utils/util'

/**
 * A module maps a name onto a collection of actions, and registers itself with Oi to list the
 * available actions.
 */
export default class Module {

  constructor(id, options) {
    _.merge(this, options, {id});
    _.defaults(this, {name: id})
  }

  /**
   * Invokes a method with some scaffolding.
   *
   * @param {string} methodName The name of the method on the task runner to invoke.
   * @param {object} argv The command line arguments parsed by yargs, to be applied to the method.
   * @protected
   */
  _invoke(methodName, argv) {
    const [, ...args] = argv._;
    const kwargs = _.pickBy(argv, (p) => p !== '_');
    return this.runTask(methodName, args.concat([kwargs]));
  }

  /**
   * Hook that runs before a task method is run when invoked through the runTask method.
   *
   * @param task The name of the task being run.
   * @param args The arguments to be passed to the method.
   */
  beforeTask(task, args) {
    this.startTime = moment();
  }

  /**
   * Runs a task (by method name or function) between the before and after hooks.
   *
   * @param {string|function} task The task to run.
   * @param {?Array.<object>} args The arguments to apply to the task.
   * @returns {object} The result of running the task.
   */
  runTask(task, args) {
    if (this.beforeTask(task, args)) {
      return false;
    }
    log.debug(`Applying task ${task.magenta} to ${this.name.cyan} ${this}...`);
    const result = this[task].apply(this, args);
    // TODO(ladeo): Handle async invocation.
    this.afterTask(task, result);
    return result;
  }

  /**
   * Hook that runs after the completion of a task run through the runTask method.
   *
   * @param task The name of the task that just finished running.
   * @param result The output of the completed task.
   * @return {*} Some output object that can be used to determine the success of the task.
   */
  afterTask(task, result) {
    return this._report(task, result);
  }

  /**
   * Logs the result of running a task.
   *
   * @param {string} task The name of the task being run.
   * @param {object} result The result object from <code>shelljs.exec</code>.
   * @protected
   */
  _report(task, result) {
    const time = moment.duration(moment().diff(this.startTime));
    reportResult(this.name, task, result, time);
    return result;
  }

  /**
   * Registers the module with the singleton registry.
   */
  register() {
    registry.register(this);
  }

}
