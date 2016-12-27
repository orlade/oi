import {exec as _exec, env, pwd, cd} from 'shelljs'
import {spawn} from 'child_process'
import expandHomeDir from 'expand-home-dir'
import * as log from 'winston'
import _ from 'lodash'
import 'colors'
import mixin from 'universal-mixin'

import JsonFile from './json_file'


/**
 * Execute a shell command with logging.
 *
 * @param {string} command The full command string to pass to shelljs for execution.
 * @param {?object} options The standard shelljs.exec options. Also supports a custom
 * <code>detached</code> option which, if true, will cause the command to be executed on a detached
 * child process via Node.js, allowing the parent process to exit.
 * @param {?function} callback A callback to invoke when an asynchronous (attached) process exits.
 */
export function exec(command, options = {}, callback = null) {
  let message = `Executing ${command.cyan} in ${(expandHome(options.workingDir) || pwd()).magenta}`;
  if (options) {
    if (typeof options === 'object') {
      message += ` with options ${JSON.stringify(options).magenta}`;
    }
    if (callback || typeof options === 'function') {
      message += ` with callback ${(callback || options).toString().magenta}`;
    }
  }
  log.debug(`${message}...`);

  // Colors may not appear in stdout. See https://github.com/shelljs/shelljs/issues/86.
  const doExec = () => {
    if (!options.detached) {
      return _exec(command, options, callback);
    }

    log.debug('Spawning detached child process...');
    const [main, ...args] = command.split(' ');
    const result = spawn(main, args, {detached: true, stdio: ['ignore', 'ignore', 'ignore']});
    result.unref();
    return result;
  };
  const result = execIn(doExec, options.workingDir);

  if (result) {
    if (result.code) {
      log.error(`Command`.red, command.cyan, `exited with code ${result.code}`.red);
      log.error(result.output);
    } else if (/warning\:?\]?/i.test(result.output)) {
      log.warn(`Command`.yellow, command.cyan, `completed with warnings`.yellow);
    }
  }
  return result;
}

/**
 * Invokes a function within a given working directory.
 *
 * @param {function} func The function to invoke.
 * @param {?string} workingDir The directory to be in when executing the function. If not provided,
 * the function will be invoked in the current directory.
 */
function execIn(func, workingDir) {
  const currentDir = process.cwd();
  if (!workingDir || workingDir === currentDir) {
    return func();
  }

  cd(expandHomeDir(workingDir));
  try {
    return func();
  } finally {
    cd(currentDir);
  }
}


/**
 * Joins an array of items with commas, and optionally colours each one.
 *
 * @param {Array.<object>} items The array of items to join.
 * @param {?string} color The color to apply to each item in the output string.
 * @returns {string} A string of the combined items.
 */
export function commafy(items, color) {
  if (color) {
    return _.map(items, (item) => _.toString(item)[color]).join(', ');
  } else {
    return items.join(', ');
  }
}

/**
 * Converts multi-line CLI output into an array of values (one per line), or null if the output is
 * just whitespace.
 *
 * @param {string} string The output string to convert.
 * @returns {?Array<string>} An array of the lines of output, or null if th ere is no output.
 */
export function arrayifyOutput(string) {
  string = string.trim();
  if (/^\s*$/.test(string)) {
    return null;
  }
  return _.invokeMap(string.split('\n'), 'trim');
}

/**
 * Substitutes any environment variables in string with values in the environment.
 *
 * @param string The string in which to replace environment variable references.
 * @param extraEnv An optional map of additional environment variables to merge into the current
 * environment.
 */
export function substituteEnv(string, extraEnv = {}) {
  const allEnv = _.merge({}, env, extraEnv);
  return string.replace(/\$(\w+)/g, (string, match) => allEnv[match]);
}

/**
 * Logs the outcome of executing a command based on the result object it returns.
 *
 * @param {string} task The name of the task being run.
 * @param {object} result The result object from <code>shelljs.exec</code>.
 * @param {int} time The time in ms since the task runner was created.
 */
export function reportResult(task, result, time, {info = false} = {}) {
  const timeStr = `(${time.asSeconds()} secs)`;
  if (determineSuccess(result)) {
    log[info ? 'info' : 'debug'](`${task} completed successfully ${timeStr}`.green);
  } else {
    let message = `${task} failed`;
    if (result) {
      result.output && console.log(result.output);
      if (result.code) {
        message += ` (exit code ${result.code})`;
      }
    }
    log.error(`${message} ${timeStr}\n`.red);
  }
}

/**
 * Returns true if the result indicates a success, or false otherwise.
 *
 * @param {object} result The output of running a task.
 * @returns {boolean} True if successful, false otherwise.
 */
export function determineSuccess(result) {
  return !(result === false || (result != null && typeof result === 'object' && result.code));
}
/**
 * Standard error for yargs commands.
 *
 * @param msg The error message describing the failure.
 * @param err The JS error object, if one was thrown.
 * @param yargs The yargs instance.
 */
export function fail(msg, err, yargs) {
  if (err) throw err; // preserve stack
  console.log(yargs.help());
  console.error(`ERROR: ${msg}`.red);
  log.level == 'debug' && console.trace();
  process.exit(1)
}

/**
 * Expands any home directory reference in a path.
 * @param path The path to expand ~s within.
 * @returns {string} The expanded path.
 */
export function expandHome(path) {
  if (!path) return path;
  const match = path.match(/.*(~.*)/);
  return match ? expandHomeDir(match[1]) : path;
}

export function loadConfig(path) {
  log.debug(`Reading config from ${path.magenta}...`);
  let config = new JsonFile(path).read();
  // TODO(ladeo): Refactor to be more generic.
  if (config.baseDir) {
    config.baseDir = expandHome(config.baseDir);
  }
  return config;
}

/**
 * Logs error messages, shows usage help and rethrows errors that are caught by yargs.
 *
 * @param {object} yargs The yargs object from which to handle errors.
 */
export function handleYargsError(yargs) {
  /**
   * @param {string} message The message of the failure that occurred.
   * @param {?Error} err The error that was thrown (if any).
   */
  return function (message, err) {
    console.error(message.red);
    yargs.showHelp();
    if (err) {
      err.stack = err.stack.red;
      throw err;
    }
  };
}

/**
 * Gets the names of all properties, both enumerable and non-enumerable, own and inherited, of the
 * object.
 *
 * @param obj
 * @returns {string[]}
 */
export function getAllPropertyNames(obj) {
  var props = [];
  do {
    props = props.concat(Object.getOwnPropertyNames(obj));
  } while (obj = Object.getPrototypeOf(obj));

  return props;
}

/**
 * Gets the names of all properties, both enumerable and non-enumerable, own and inherited, that
 * don't begin with an underscore.
 *
 * @param obj
 * @returns {string[]}
 */
export function getAllPublicPropertyNames(obj) {
  const BASE_NAMES = _.zipObject(Object.getOwnPropertyNames(Object.prototype));
  var props = [];
  do {
    const names = Object.getOwnPropertyNames(obj);
    if (names === BASE_NAMES) {
      break;
    }
    props = props.concat(names.filter((name) => !name.startsWith('_') && !(name in BASE_NAMES)));
  } while (obj = Object.getPrototypeOf(obj));

  return _.uniq(props);
}

/**
 * Gets the names of all properties of an object, both enumerable and non-enumerable, own and
 * inherited, that make it different from some other object.
 *
 * @param {object} obj The object to get the unique property names of.
 * @param {?object} other The object to compare the input's properties to to determine uniqueness.
 * @returns {string[]}
 */
export function getAllUniquePropertyNames(obj, other) {
  const otherNames = _.zipObject(getAllPropertyNames(other));
  return getAllPropertyNames(obj).filter((name) => !(name in otherNames));
}

/**
 * Creates a mixin function from a class.
 *
 * @param {object} SourceClass
 * @returns {Function}
 */
export function mixinClass(SourceClass) {
  return function (options = {}) {
    options.skipInit = true;
    const obj = new SourceClass(options);
    let behavior = {};
    _.each(getAllUniquePropertyNames(obj, {}), (key) => {
      behavior[key] = obj[key];
    });
    return function (target) {
      log.debug(`Mixing behaviour of ${SourceClass.name} into ${target.name}...`);
      return mixin(behavior)(target);
    }
  }
}
