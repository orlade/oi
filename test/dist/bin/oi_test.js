/* global describe, it */

import {exec} from '../../../src/utils/util';
import assert from 'assert';
require('chai').should();

describe("Oi CLI", () => {

  it("can be invoked", function() {
    this.timeout(10000);
    const result = exec('node dist/bin/oi.js -v');
    result.code.should.equal(0);
    result.toString().trim().should.match(/^\d+\.\d+\.\d+$/);
  });

});
