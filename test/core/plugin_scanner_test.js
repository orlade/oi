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

  it("can scan for and load plugins", (done) => {
    console.log(process.config.variables.node_prefix)
    mockFs({
      '/lib/node_modules/@oi/oi-oi': {
        'package.json': `
            {
              "extensions": {
                "oi:module": {
                  "dev": "./index.js"
                }
              }
            }`
      }
    });

    const scanner = new PluginScanner();

    scanner.loadPlugins((err, modules) => {
      modules.should.not.be.empty;
      done();
    })
  });

  // it("can be created with a actions", () => {
  //   var scanner = new Module({command: 'foo', actions: {bar: {command: 'bar', handler: noop}}});
  // });

  // it("can be created with methods", () => {
  //   var scanner = new Module({command: 'foo', bar: noop});
  // });

  // it("cannot be created without a command", () => {
  //   try {
  //     new Module();
  //   } catch (e) {
  //     return;
  //   }
  //   throw Error("Creation should have failed");
  // });

  // it("cannot be created without any actions, handler or methods", () => {
  //   try {
  //     new Module({command: 'foo'});
  //   } catch (e) {
  //     return;
  //   }
  //   throw Error("Creation should have failed");
  // });

  // it("substitutes local configuration values", () => {
  //   new Module({
  //     command: 'foo',
  //     handler: noop,
  //     config: {k: '${a}${b}${a}'}
  //   })._substituteConfig({a: 1, b: 2, c: 3}, 'k') === '121';
  // });

  // it("decorates handlers to substitute local configuration values", (done) => {
  //   const expectedValue = 'bar';
  //   const handler = (name, options) => {
  //     if (options.k !== expectedValue) throw Error("Local config value not substituted for handler");
  //     done();
  //   };

  //   new Module({
  //     command: 'foo',
  //     handler,
  //     config: {k: '${a}'}
  //   }).foo('foo', {a: expectedValue});
  // });

});
