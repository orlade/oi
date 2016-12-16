import Module from './module'
import * as log from 'winston'
import _ from 'lodash'

/**
 * A module maps a name onto a collection of actions, and registers itself with Oi to list the
 * available actions.
 */
export default class PreModule extends Module {

  constructor(options) {
    super(options.command, options);
    _.merge(this, options);

    log.debug("Initializing premodule", this, JSON.stringify(options));
    if (this.handler) {
      log.debug("Decorating handler to be invoked with hooks");
      this[this.command] = this.handler;
      this.handler = (argv) => {
        return this._invoke(this.command, argv);
      }
    } else if (this.actions) {
      log.debug("Building actions", this.actions);
      this.builder = (yargs) => {
        _.each(this.actions, (action, command) => yargs.command(new PreModule(_.merge(action, {command}))))
      }
    }
  }

}
