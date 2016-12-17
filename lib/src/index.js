import Module from './core/module'
import PluginScanner from './core/plugin_scanner'
import registry from './core/registry'
import * as utils from './utils/util'
import JsonFile from './utils/json_file'

module.exports = {

  Module,
  registry,
  PluginScanner,

  JsonFile,
  utils,
  // Allow the Oi lib's log level to be set externally.
  log: require('winston')

};
