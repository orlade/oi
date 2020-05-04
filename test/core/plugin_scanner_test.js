import PluginScanner from '../../src/core/plugin_scanner'
const mockFs = require('mock-fs');

require('chai').should();

afterEach(mockFs.restore);

describe("PluginScanner", () => {

  it("can be created", () => {
    const scanner = new PluginScanner();
    scanner.should.not.be.null;
  });

  it("can scan for plugins", (done) => {
    const scanner = new PluginScanner();

    scanner.loadPlugins((err, modules) => {
      modules.should.be.empty;
      done();
    })
  });

  // it("can scan for and load plugins", (done) => {
  //   mockFs({
  //     '/lib/node_modules/@oi/oi-oi': {
  //       'package.json': `
  //           {
  //             "extensions": {
  //               "oi:module": {
  //                 "dev": "./index.js"
  //               }
  //             }
  //           }`
  //     }
  //   });

  //   const scanner = new PluginScanner();

  //   scanner.loadPlugins((err, modules) => {
  //     modules.should.not.be.empty;
  //     done();
  //   })
  // });
});
