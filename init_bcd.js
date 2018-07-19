"use strict";

const fs = require('fs');
const path = require('path');
const utils = require('./utils');

const bcdDir = process.argv[2];
const bcdFile = process.argv[3];
if (! bcdDir || ! bcdFile) {
  const cmd = path.basename(process.argv[1]);
  const usage =
`Usage:
  node ${cmd} bcd-dir bcd-file
    bcd-dir: path to BCD folder, e.g. browser-compat-data
    bcd-file: path to BCD mapping file, e.g. bcd.json (will be overwritten!)
Example:
  node ${cmd} browser-compat-data bcd.json
    Read data from browser-compat-data/javascript/{,**/}*.json,
    write into bcd.json.`;
  console.log(usage);
  return;
}

// recursively yield all files in dir
function *files(base, dir) {
  const names = fs.readdirSync(path.join(base, dir));
  for (const name of names) {
    const file = dir + name;
    const stats = fs.lstatSync(path.join(base, file));
    if (stats.isDirectory()) yield *files(base, file + '/');
    else if (stats.isFile()) yield file;
  }
}

// add property paths to bcd
function add(bcd, tree, path, file) {
  for (const [key, branch] of Object.entries(tree)) {
    if (key === '__compat') {
      // ignore deprecated features
      if (branch.status.deprecated) continue;

      if (bcd[path]) throw new Error('duplicate path ' + path);
      bcd[path] = {
        // undefined is dropped in JSON, use explicit empty value instead
        mdn_url: branch.mdn_url ? branch.mdn_url : '',
        mdn_desc: branch.description ? branch.description : '',
        bcd_file: file,
      };
    }
    else {
      add(bcd, branch, path ? path + '.' + key : key, file);
    }
  }
}

let bcd = Object.create(null);
for (const file of files(bcdDir, 'javascript/')) {
  const data = utils.readJsonSync(path.join(bcdDir, file));
  add(bcd, data, '', file);
}

utils.writeJsonSync(bcdFile, bcd);
