# Oi

[![Build Status][travis-img]][travis-url]
[![Coverage Status][cover-img]][cover-url]
[![NPM Version][npm-img]][npm-url]

A CLI tool for automating development tasks.

## Getting Started

To install Oi:

    npm install -g @oi/oi
    oi -h

As an example of an Oi plugin, you can install [Oi's own development plugin][oi-oi]:

    npm install -g @oi/oi-oi
    oi oi -h

Note that if you are using `nvm`, global plugins will need to be installed using the same NVM you
intended to run them with.

## Structure

Oi's command-line interface is structured like that of Git. After the initial `oi` command follows
the name of a `module`, and after that is an `action` to perform on the module. Options can be
specified at any point after the `oi` command.

## Plugins

Oi is designed to be a framework with which modular, extensible CLI tools can be built. Using the
[js-plugins][jsp] library, Oi scans for plugins that define modules, each of which registers its own
command and associated actions. New project-specific tools can then be built by aggregating the
commands for existing tools, and extending them for particular use cases.

### Creating a Plugin

An Oi plugin is a Node.js module that contains an extra section in its `package.json` file and
exports classes that serve as modules.

The extra `package.json` section is an `extensions` object, which declares one or more modules
within a map called `oi:module`. Each key is the name of a module, and the corresponding value is
the path (relative to the `package.json` file) from which to `require` the module class. For example:

    "extensions": {
      "oi:module": {
        "foo": "./module/foo"
      }
    }

The only requirement of the exported module itself is that it must be a class, an object, or a
function that returns a class or an object.

Note that the path **must include a slash** (e.g. `./index.js` or `/path/to/index.js`) if it refers
to a file that should be `require`d.

### Oi Plugin Examples

 - [`oi-oi`][oi-oi]: CLI for development tasks on Oi itself.
 - [`oi-sysl`][oi-sysl]: CLI for running
   [Sysl][sysl] tasks.


[travis-img]: https://travis-ci.org/orlade/oi.svg?branch=develop
[travis-url]: https://travis-ci.org/orlade/oi
[cover-img]: https://coveralls.io/repos/github/orlade/oi/badge.svg?branch=develop
[cover-url]: https://coveralls.io/github/orlade/oi?branch=develop
[npm-img]: https://img.shields.io/npm/v/@oi/oi.svg
[npm-url]: https://www.npmjs.com/package/@oi/oi

[jsp]: https://github.com/easeway/js-plugins
[oi-oi]: https://github.com/orlade/oi-oi
[oi-sysl]: https://github.com/orlade/oi-sysl
[sysl]: https://github.com/ANZ-bank/Sysl
