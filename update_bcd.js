"use strict";

const path = require('path');
const utils = require('./utils');

const nctFile = process.argv[2];
const bcdFile = process.argv[3];
const bcdDir = process.argv[4];
if (! nctFile || ! bcdFile || ! bcdDir) {
  const cmd = path.basename(process.argv[1]);
  const usage =
`Usage:
  node ${cmd} nct-file bcd-file bcd-dir
    nct-file: path to NCT mapping file, e.g. nct.json
    bcd-file: path to BCD mapping file, e.g. bcd.json
    bcd-dir: path to BCD folder, e.g. browser-compat-data (files will be modified!)
Example:
  node ${cmd} nct.json bcd.json browser-compat-data
    Read data from nct.json and mappings from bcd.json,
    update target files browser-compat-data/javascript/{,**/}*.json.`;
  console.log(usage);
  return;
}

const tree = utils.readJsonSync(nctFile);

const map = utils.readJsonSync(bcdFile);

