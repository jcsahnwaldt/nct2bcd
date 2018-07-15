"use strict";

const fs = require('fs');

const bcdDir = process.argv[2];
const bcdFile = process.argv[3];
if (! bcdDir || ! bcdFile) {
  const cmd = process.argv[1].split('\\').pop().split('/').pop();
  console.log('Usage:');
  console.log(`node ${cmd} bcd-dir bcd-file`);
  console.log('Example:');
  console.log(`node ${cmd} browser-compat-data bcd.json`);
  console.log('merge data from browser-compat-data/javascript/{,**/}*.json into bcd.json');
  return;
}

const jsDir = bcdDir + (bcdDir.endsWith('/') ? '' : '/') + 'javascript/';

// recursively yield all files in dir
function *files(base, dir) {
  const names = fs.readdirSync(base + dir);
  for (const name of names) {
    const path = dir + name;
    const stats = fs.lstatSync(base + path);
    if (stats.isDirectory()) yield *files(base, path + '/');
    else if (stats.isFile()) yield path;
  }
}

// add property paths to bcd, drop deprecated features
function add(bcd, tree, path, file) {
  for (const [key, val] of Object.entries(tree)) {
    if (key === '__compat') {
      if (val.status.deprecated) continue;
      if (bcd[path]) throw new Error('duplicate path '+path);
      bcd[path] = {
        // undefined is dropped in JSON, use explicit empty value instead
        mdn_url: val.mdn_url ? val.mdn_url : '',
        bcd_file: file,
      };
    }
    else {
      add(bcd, val, path + (path === '' ? '' : '/') + key, file);
    }
  }
}

let bcd = Object.create(null);
for (const path of files(jsDir, '')) {
  const json = fs.readFileSync(jsDir + path, 'utf8');
  const all = JSON.parse(json);
  const js = all.javascript;
  add(bcd, js, '', path);
}

const json = JSON.stringify(bcd, null, 2);
fs.writeFileSync(bcdFile, json, 'utf8');
