/* global describe, it */

import {exec} from '../../../src/utils/util';
import assert from 'assert';
require('chai').should();

describe("Oi CLI", () => {

  it("can be invoked", (done) => {
    const result = exec('node dist/bin/oi.js -v');
    console.log(result);
    console.log(result.toString());
    console.log(result.code);
    console.log(result.stdout);
    console.log(result.stdout.trim());
    console.log(result.stdout.trim().match(/^\d+\.\d+\.\d+$/));
    try {
      result.stdout.trim().should.match(/^\d+\.\d+\.\d+$/);
      done();
    } catch (e) {
      console.error('ERROR:', e);
      done(e);
      throw Error('FAIL');
    }
  });

});
