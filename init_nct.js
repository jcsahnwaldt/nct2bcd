"use strict";

const fs = require('fs');
const path = require('path');
const utils = require('./utils');

const nctDir = process.argv[2];
const nctFile = process.argv[3];
if (! nctDir || ! nctFile) {
  const cmd = path.basename(process.argv[1]);
  const usage =
`Usage:
  node ${cmd} nct-dir nct-file
    nct-dir: path to NCT folder, e.g. node-compat-table
    nct-file: path to NCT mapping file, e.g. nct.json (will be overwritten!)
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

const tree = utils.readJsonSync(nctFile, {required: false});

// Note: Almost all node-compat-table/results/v8/*.json files
// have the same keys as node-compat-table/testers.json.
// Only the v8/0.*.json and the v8/bleeding.json files
// have different keys.
const file = path.join(nctDir, 'testers.json');
const nct = utils.readJsonSync(file);

for (const [tag, data] of Object.entries(nct)) {
  if (tag.startsWith('_')) continue;
  for (const key of Object.keys(data)) {
    if (key.startsWith('_')) continue;
    const parts = key.split('›');
    add(tree, '', tag, ...parts, 'bcd_path');
  }
}

utils.writeJsonSync(nctFile, tree);
