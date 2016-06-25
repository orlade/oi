import Module from '../core/module'
import * as log from 'winston'
import 'colors'

/**
 * Sample module class invoked with "oi foo".
 */
export default class Foo extends Module {

  constructor() {
    super('foo', {
      name: 'Foo',
      description: `Actions for interacting with the ${'Foo'.cyan}`
    });
    this._actions = {
      bar: 'Bars the Foo'
    }
  }

  /**
   * Example action method, invoked on the Foo module with "oi foo bar".
   */
  bar() {
    log.info("You have successfully bar'd the Foo!");
  }

}
