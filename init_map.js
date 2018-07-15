"use strict";

const fs = require('fs');

let bcdDir = process.argv[2];
let mapFile = process.argv[3];
if (! bcdDir || ! mapFile) {
  const cmd = process.argv[1].split('\\').pop().split('/').pop();
  console.log('Usage:');
  console.log(`node ${cmd} bcd-dir map-file`);
  console.log('Example:');
  console.log(`node ${cmd} browser-compat-data map.json`);
  console.log('merges data from all *.json files in browser-compat-data/javascript/ into map.json');
  return;
}

if (! bcdDir.endsWith('/')) bcdDir += '/';

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
function buildTree(dst, src) {

  if (dst === undefined) {
    // don't use {} - we set 'toString' properties etc.
    dst = Object.create(null);
    // set initial value for NCT path
    dst.__nct = '';
  }

  for (const [key, val] of Object.entries(src)) {
    if (key === '__compat') {
      // Node: if there are duplicate paths, add logging code to print the paths
      if (dst.__nct) throw new Error('duplicate path');
      dst.__mdn = val.mdn_url ? val.mdn_url : '';
    }
    else if (! (val.__compat && val.__compat.status.deprecated)) {
      dst[key] = buildTree(dst[key], val);
    }
  }

  return dst;
}

let tree;
for (const path of files(bcdDir + 'javascript/')) {
  const json = fs.readFileSync(path, 'utf8');
  const obj = JSON.parse(json);
  tree = buildTree(tree, obj);
}

const json = JSON.stringify(tree, null, 2);
fs.writeFileSync(mapFile, json, 'utf8');