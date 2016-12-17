import Module from '../core/module'
import * as log from 'winston'
import 'colors'
import {exec} from '../utils/util'

/**
 * The Oi development module, invoked with "oi oi".
 */
export default class Foo extends Module {

  constructor() {
    super('oi', {
      name: 'Oi',
      description: `Actions for interacting with ${'Oi'.cyan}`
    });
    this._actions = {
      build: 'Builds Oi from source'
    }
  }

  /**
   * Example action method, invoked on the Foo module with "oi foo bar".
   */
  build() {
    exec('npm run build');
    log.info("You have successfully bar'd the Foo!");
  }

}
