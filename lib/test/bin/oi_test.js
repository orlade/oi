import {exec} from '../../src/utils/util'

describe("Oi CLI", () => {

  it("can be invoked", (done) => {
    exec('node dist/bin/oi.js -v', {}, (code, output) => {
      if (code !== 0) {
        done(Error("Invalid exit code"))
      } else if (!output.match(/\d+\.\d+\.\d+/)) {
        done(Error("Invalid version output"))
      } else {
        done();
      }
    });
  });

});
