"use strict";

const fs = require('fs');

let source = process.argv[2];
let target = process.argv[3];
if (! source || ! target) {
  const cmd = process.argv[1].split('\\').pop().split('/').pop();
  console.log('Usage:');
  console.log(`node ${cmd} source-dir target-file`);
  console.log('Example:');
  console.log(`node ${cmd} browser-compat-data nct2bcd.json`);
  console.log('merges data from all *.json files in browser-compat-data/javascript/ into nct2bcd.json');
  return;
}

if (! source.endsWith('/')) source += '/';

// recursively yield all files in dir
function *files(dir) {
  const names = fs.readdirSync(dir);
  for (const name of names) {
    const path = dir + name;
    const stats = fs.lstatSync(path);
    if (stats.isDirectory()) yield *files(path + '/');
    else if (stats.isFile()) yield path;
  }
}

// add property paths to dst, replace __compat objects by simple values, drop deprecated features
function addPaths(dst, src) {
  if (dst === undefined) {
    // don't use {} - we set 'toString' properties etc.
    dst = Object.create(null);
    dst.__nct = '';
  }

  for (const [key, val] of Object.entries(src)) {
    if (key === '__compat') {
      if (dst.__nct) throw 'duplicate path';
      dst.__mdn = val.mdn_url ? val.mdn_url : '';
    }
    else if (! (val.__compat && val.__compat.status.deprecated)) {
      dst[key] = addPaths(dst[key], val);
    }
  }

  return dst;
}

let tree;

for (const path of files(source + 'javascript/')) {
  const json = fs.readFileSync(path, 'utf8');
  const obj = JSON.parse(json);
  tree = addPaths(tree, obj);
}

const json = JSON.stringify(tree, null, 2);
fs.writeFileSync(target, json, 'utf8');