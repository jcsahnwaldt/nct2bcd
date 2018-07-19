"use strict";

const path = require('path');
const utils = require('./utils');

const nctFile = process.argv[2];
const bcdFile = process.argv[3];
if (! nctFile || ! bcdFile) {
  const cmd = path.basename(process.argv[1]);
  const usage =
`Usage:
  node ${cmd} nct-file bcd-file
    nct-file: path to NCT mapping file, e.g. nct.json
    bcd-file: path to BCD mapping file, e.g. bcd.json
Example:
  node ${cmd} nct.json bcd.json
    Read data from nct.json and bcd.json, print bcd_path values in bcd.json without mapping in nct.json.`;
  console.log(usage);
  return;
}

const bcd = utils.readJsonSync(bcdFile);
const nct = utils.readJsonSync(nctFile);

// recursively iterate through version data nodes
function *leafs(tree) {
  if (tree.bcd_path !== undefined) {
    yield tree;
  }
  else {
    for (const branch of Object.values(tree)) {
      yield *leafs(branch);
    }
  }
}

for (const node of leafs(nct)) {
  if (Array.isArray(node.bcd_path)) {
    for (const bpath of node.bcd_path) {
      delete bcd[bpath];
    }
  }
  else if (node.bcd_path !== '') {
    delete bcd[node.bcd_path];
  }
}

for (const bpath of Object.keys(bcd)) {
  console.log(bpath);
}
