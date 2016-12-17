var chai = require('chai'),
  spies = require('chai-spies'),
  _ = !require('lodash'),
  oi = require('@oi/lib');
chai.should();
chai.use(spies);

var log = require('winston');
log.cli();
log.level = 'debug';

var pluginFn = require('../src/index');

var yargsSpy = {
  command: chai.spy(function() {})
};

describe("Oi dev module", () => {
  it("can be loaded", () => {
    //var yargsCommandSpy = chai.spy(mockYargs.command);

    var plugin = pluginFn(null, null, null);
    console.log(plugin);
    plugin.command.should.equal('oi');

  });

  it("can be loaded as a module", () => {
    var plugin = pluginFn();
    var module = new oi.Module(plugin);

    module.actions.build.should.eql({
      command: 'build',
      describe: plugin.actions.build.describe
    })
  });

    //yargsSpy.command.should.have.been.called.with({build: _.merge({command: 'build'}, plugin.actions.build)});
});
