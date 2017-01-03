import path from 'path';
import PluginManager from 'js-plugins';
import _ from 'lodash';
import * as log from 'winston';

const pluginManager = new PluginManager();

/**
 * Overrides the js-plugins scanSubdirs method to also scan the @oi subdir of
 * each given dir. Oi plugins will typically be named @oi/plugin-name to group
 * them and avoid naming conflicts. As such they will be installed into an @oi
 * subdir of their target directory.
 *
 * @param extraPaths The paths to search in addition to the js-plugins defaults.
 */
function scanPluginSubdirs(extraPaths) {
  const originalScanSubdirs = pluginManager.scanSubdirs.bind(pluginManager);

  // Replace the scanSubdirs method so that scan() calls our enhanced
  // scanSubdirs instead.
  pluginManager.scanSubdirs = function(paths) {
    // Add the extra paths provided by the PluginScanner.
    paths = paths.concat(extraPaths);
    // Search the @oi subdirectory of each scanned subdir.
    const oiSubdir = (subdirPath) => [subdirPath, path.join(subdirPath, '@oi')];
    paths = _.flatMap(paths, oiSubdir);
    log.debug(`Scanning for plugins in ${_.map(paths, 'magenta').join(', ')}`);
    // Delegate back to the original method.
    return originalScanSubdirs(paths);
  };
}


/** The name of the js-plugins extension point to scan for Oi plugins. */
const MODULE_NAME = 'oi:module';

/**
 * Scans for Oi plugins and loads modules from them to be registered.
 */
export default class PluginScanner {

  /**
   * Configuration options for the plugin scanner.
   *
   * @typedef {Object} Config
   * @property {string[]} paths Optional set of paths to search for plugins in
   * addition to the js-plugin defaults.
   * @property {object} host An object to inject as the host value into all
   * plugin factory methods.
   */

  /**
   * Creates a new plugin scanner.
   *
   * @param {Config} options Configuration options for the plugin scanner.
   */
  constructor(options = {paths: [], host: {}}) {
    options.paths = _.castArray(options.paths || []);
    _.merge(this, options);
  }

  /**
   * Scans for plugins, creates modules from them, and returns the modules
   * asynchronously via a callback. The plugins and modules are also saved to
   * fields so they can be accessed later.
   *
   * @param {function} callback The function to call with the loaded modules. If
   * an error occurred, the error is the first argument (if not, it's
   * undefined). If successful, the modules are the second argument.
   */
  loadPlugins(callback) {
    scanPluginSubdirs(this.paths);
    pluginManager.scan();
    const options = {multi: true, onerror: this.onError};
    const host = {log};
    pluginManager.connect(host, MODULE_NAME, options, (err, plugins, names) => {
      if (err) {
        log.error(err);
        callback(err, null);
      }
      this.plugins = plugins;
      if (names && names.length) {
        log.debug(`Discovered plugins: [${names.join(', ')}]`);
        this.modules = plugins.map(this.plugModule);
        log.debug(`Created plugin modules: `
          + `[${this.modules.map((m) => m.id).join(', ')}]`);
        callback(null, this.modules);
      } else {
        log.debug('No plugins discovered');
        callback(null, []);
      }
    });
  }

  /**
   * Handles an error thrown by the plugin scanning.
   *
   * @param {object} error The error that caused the scan to fail.
   */
  onError(error) {
    console.error('Plugin scanner error:', error);
  }

  /**
   * Transforms a loaded plugin into a module.
   *
   * Modules can be exported by plugins in different forms (classes, objects and
   * functions), so this method does whatever needs to be done to convert a
   * plugin export into a module.
   *
   * @param {{}} loadedPlugin The exported object of a plugin.
   * @returns {{}} The module retrieved from the plugin output.
   */
  plugModule(loadedPlugin) {
    // Currently all plugins are modules, so this is redundant.
    return loadedPlugin;
  }

}
