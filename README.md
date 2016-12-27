# Oi

[![Build Status](https://travis-ci.org/orlade/oi.svg?branch=develop)](https://travis-ci.org/orlade/oi)

A CLI tool for automating development tasks.

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
the path (relative to the `package.json` file) from which to require the module class. For example:

    "extensions": {
      "oi:module": {
        "foo": "./module/foo"
      }
    }

The only requirement of the exported module itself is that it must be a class, an object, or a
function that returns either a class or an object.

Note that the path **must include a slash** (e.g. `./index.js` or `/path/to/index.js`) if it refers
to a file that should be `require`d.

[jsp]: https://github.com/easeway/js-plugins
