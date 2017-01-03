/* global describe, it */

import {exec} from '../../../src/utils/util';
import assert from 'assert';

describe("Oi CLI", () => {

  it("can be invoked", () => {
    const result = exec('node dist/bin/oi.js -v');
    assert(result.stdout.trim().match(/\d+\.\d+\.\d+/), "Invalid version output");
  });

});
