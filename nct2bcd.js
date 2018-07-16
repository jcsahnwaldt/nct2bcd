"use strict";

const fs = require('fs');

const nctDir = process.argv[2];
const nctFile = process.argv[3];
const bcdFile = process.argv[4];
const bcdDir = process.argv[5];
if (! nctDir || ! nctFile || ! bcdFile || ! bcdDir) {
  const cmd = process.argv[1].split('\\').pop().split('/').pop();
  console.log(
`Usage:
  node ${cmd} nct-dir nct-file bcd-file bcd-dir
    nct-dir: path to NCT folder, e.g. node-compat-table
    nct-file: path to NCT mapping file, e.g. nct.json
    bcd-file: path to BCD mapping file, e.g. bcd.json
    bcd-dir: path to BCD folder, e.g. browser-compat-data
Example:
  node ${cmd} node-compat-table nct.json bcd.json browser-compat-data
    Parse data in node-compat-table/results/v8/*.json,
    map data using nct.json and bcd.json,
    write results to browser-compat-data/javascript/{,**/}*.json.`
  );
  return;
}

const v8dir = nctDir + (nctDir.endsWith('/') ? '' : '/') + 'results/v8/';

// Note: Almost all node-compat-table/results/v8/*.json files
// have the same keys as node-compat-table/testers.json.
// Only the v8/0.*.json and the v8/bleeding.json files
// have different keys.

