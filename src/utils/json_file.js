import fs from 'fs-extra';
import log from '../core/logger';
import 'colors';

import {expandHome} from './util';

/**
 * Exposes functions for working with a JSON file.
 */
export default class JsonFile {
  /**
   * Creates a new JsonFile object, without loading the content of the
   * underlying file.
   *
   * @param {string} path The path to the underlying file.
   */
  constructor(path) {
    this.path = expandHome(path);
  }

  /**
   * Reads and returns the content of the JSON file.
   * @return {{}} The content of the JSON file as a JS object.
   */
  read() {
    log.debug(`Reading file ${this.path.magenta}...`);
    try {
      // Ensure the file exists.
      fs.ensureFileSync(this.path);
      const content = fs.readFileSync(this.path, 'utf-8');
      const json = content ? JSON.parse(content) : {};
      log.debug(`Contents of ${this.path.magenta}:\n${JSON.stringify(json)}`);
      return json;
    } catch (err) {
      log.error(`Failed to read file ${this.path.magenta}:`, err);
      return {};
    }
  }

  /**
   * Appends a {key: value} pair to the JSON file.
   *
   * @param {string} key The key to append to the file.
   * @param {*} value The value to assign to the key.
   */
  append(key, value) {
    log.debug(`Appending {"${key}": "${value}"} to ${this.path.magenta}...`);
    const json = this.read();
    json[key] = value;
    fs.writeFile(this.path, JSON.stringify(json), (err) => {
      if (err) {
        log.error(`Failed to write file ${this.path.magenta}`, err);
      } else {
        log.debug(`Updated file ${this.path.magenta} to:\n` +
          JSON.stringify(json, null, 2));
      }
    });
  }
}
