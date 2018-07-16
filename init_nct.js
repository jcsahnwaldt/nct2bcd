"use strict";

const fs = require('fs');
const path = require('path');

const nctDir = process.argv[2];
const nctFile = process.argv[3];
if (! nctDir || ! nctFile) {
  const cmd = path.basename(process.argv[1]);
  const usage =
`Usage:
  node ${cmd} nct-dir nct-file
    nct-dir: path to NCT folder, e.g. node-compat-table
    nct-file: path to NCT mapping file, e.g. nct.json (may be overwritten!)
Example:
  node ${cmd} node-compat-table nct.json
    Parse data in node-compat-table/testers.json,
    write result into nct.json.`;
  console.log(usage);
  return;
}

function add(tree, data, ...path) {
  const first = path.shift();
  if (path.length === 0) {
    if (tree[first] === undefined) tree[first] = data;
  }
  else {
    if (tree[first] === undefined) tree[first] = Object.create(null);
    add(tree[first], data, ...path);
  }
}

let tree;
try {
  let json = fs.readFileSync(nctFile, 'utf8');
  tree = JSON.parse(json);
}
catch (e) {
  if (e.code !== 'ENOENT') throw e;
  tree = Object.create(null);
}

// Note: Almost all node-compat-table/results/v8/*.json files
// have the same keys as node-compat-table/testers.json.
// Only the v8/0.*.json and the v8/bleeding.json files
// have different keys.
const file = path.join(nctDir, 'testers.json');

let json = fs.readFileSync(file, 'utf8');
const nct = JSON.parse(json);

for (const [tag, data] of Object.entries(nct)) {
  if (tag.startsWith('_')) continue;
  for (const key of Object.keys(data)) {
    if (key.startsWith('_')) continue;
    const parts = key.split('›');
    add(tree, '', tag, ...parts, 'bcd_path');
  }
}

json = JSON.stringify(tree, null, 2);
fs.writeFileSync(nctFile, json, 'utf8');
