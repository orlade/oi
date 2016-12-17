import Module from '../src/core/module'

const noop = function () {
};

describe("Module", () => {

  it("can be created with a handler", () => {
    var module = new Module({command: 'foo', handler: noop});
  });

  it("can be created with a actions", () => {
    var module = new Module({command: 'foo', actions: {bar: {command: 'bar', handler: noop}}});
  });

  it("can be created with methods", () => {
    var module = new Module({command: 'foo', bar: noop});
  });

  it("cannot be created without a command", ()=> {
    try {
      new Module();
    } catch (e) {
      return;
    }
    throw Error("Creation should have failed");
  });

  it("cannot be created without any actions, handler or methods", ()=> {
    try {
      new Module({command: 'foo'});
    } catch (e) {
      return;
    }
    throw Error("Creation should have failed");
  });

});
