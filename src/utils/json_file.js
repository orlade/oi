import fs from 'fs'
import touch from 'touch'
import * as log from 'winston'
import 'colors'

import {expandHome} from './util'

/**
 * Exposes functions for working with a JSON file.
 */
export default class JsonFile {

  constructor(path) {
    this.path = expandHome(path);
  }

  touch() {
    log.debug(`Touching file ${this.path.magenta}...`);
    touch.sync(this.path);
  }

  read() {
    log.debug(`Reading file ${this.path.magenta}...`);
    try {
      // Ensure the file exists.
      this.touch();
      const content = fs.readFileSync(this.path, 'utf-8');
      const json = content ? JSON.parse(content) : {};
      log.debug(`Contents of ${this.path.magenta}:\n${JSON.stringify(json, null, 2)}`);
      return json;
    } catch (err) {
      log.error(`Failed to read file ${this.path.magenta}:`, err);
      return {};
    }
  }

  append(key, value) {
    log.debug(`Appending {"${key}": "${value}"} to file ${this.path.magenta}...`);
    let json = this.read();
    json[key] = value;
    fs.writeFile(this.path, JSON.stringify(json), (err) => {
      if (err) {
        log.error(`Failed to write file ${this.path}`, err);
      } else {
        log.debug(`Updated file ${this.path} to:\n${JSON.stringify(json, null, 2)}`);
      }
    });
  }

}
