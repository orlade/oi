import Module from '../../src/core/module';

require('chai').should();

const noop = function() {
};

describe('Module', () => {
  it('can be created with a handler', () => {
    const module = new Module({command: 'foo', handler: noop});
    module.should.not.be.null;
  });

  it('can be created with a actions', () => {
    const module = new Module({
      command: 'foo',
      actions: {bar: {command: 'bar', handler: noop}},
    });
    module.should.not.be.null;
  });

  it('can be created with methods', () => {
    const module = new Module({command: 'foo', bar: noop});
    module.should.not.be.null;
  });

  it('cannot be created without a command', ()=> {
    try {
      new Module();
    } catch (e) {
      return;
    }
    throw Error('Creation should have failed');
  });

  it('cannot be created without any actions, handler or methods', ()=> {
    try {
      new Module({command: 'foo'});
    } catch (e) {
      return;
    }
    throw Error('Creation should have failed');
  });

  it('substitutes local configuration values', () => {
    new Module({
      command: 'foo',
      handler: noop,
      config: {k: '${a}${b}${a}'},
    })._substituteConfig({a: 1, b: 2, c: 3}, 'k') === '121';
  });

  it('decorates handlers to substitute local configuration values', (done) => {
    const expectedValue = 'bar';
    const handler = (name, options) => {
      if (options.k !== expectedValue) {
        throw Error('Local config value not substituted for handler');
      }
      done();
    };

    new Module({
      command: 'foo',
      handler,
      config: {k: '${a}'},
    }).foo('foo', {a: expectedValue});
  });
});
