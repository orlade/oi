/* eslint-disable no-invalid-this */

import {exec} from '../../../src/utils/util';
require('chai').should();

describe('Oi CLI', () => {
  it('can be invoked', function() {
    this.timeout(10000);
    const result = exec('node dist/bin/oi.js -v');
    result.code.should.equal(0);
    result.toString().trim().should.match(/^\d+\.\d+\.\d+$/);
  });
});
