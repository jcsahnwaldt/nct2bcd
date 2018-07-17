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

//
// global constants
//

const flags = ['', '--harmony'];
const jsDir = path.join(bcdDir, 'javascript/');
const map = utils.readJsonSync(bcdFile);

function find(tree, ...path) {
  const first = path.shift();
  return tree === undefined ? undefined : path.length === 0 ? tree[first] : find(tree[first], ...path);
}

// are bcd flag arrays equal?
// f1, f2: arrays with bcd flag objects, e.g. [ { type: 'runtime_flag', name: '--harmony' } ]
function feq(f1, f2) {
  if (f1 === undefined && f2 === undefined) return true;
  if (! Array.isArray(f1) || ! Array.isArray(f2)) return false;
  // Note: so far, all flag arrays have one element.
  // TODO: handle multiple flags if necessary
  if (f1.length !== 1 || f1.length !== f2.length) return false;
  if (f1[0].type !== f2[0].type) return false;
  if (f1[0].name !== f2[0].name) return false;
  return true;
}

// update bcd file
// bpath: bcd path, e.g. "builtins/Array/concat"
// flag: flag, i.e. '' or '--harmony'
// versions: object with 'version_added' and/or 'version_removed' properties
function update(bpath, versions) {
  if (map[bpath] === undefined) throw new Error('invalid BCD path ' + bpath);
  const file = path.join(jsDir, map[bpath].bcd_file);
  const bcd = utils.readJsonSync(file);
  const support = find(bcd, 'javascript', ...bpath.split('/'), '__compat', 'support');
  if (support === undefined) throw new Error('invalid BCD path ' + bpath);

  const nodejs = support.nodejs;
  if (! nodejs) {
    support.nodejs = versions;
  }
  else if (Array.isArray(nodejs)) {
    let found = false;
    for (const i in nodejs) {
      if (feq(nodejs[i].flags, versions.flags)) {
        nodejs[i] = versions;
        found = true;
        break;
      }
    }
    if (! found) nodejs.push(versions);
  }
  else if (feq(nodejs.flags, versions.flags)) {
    support.nodejs = versions;
  }
  else {
    support.nodejs = [nodejs, versions];
  }

  utils.writeJsonSync(file, bcd);
}

function updatePath(nct, bpath) {
  for (const flag of flags) {
    if (nct[flag]) {
      const versions = nct[flag];
      if (flag !== '') versions.flags = [ { type: 'runtime_flag', name: flag } ];
      update(bpath, versions);
    }
  }
}

function updateAll(nct) {
  if (nct.bcd_path !== undefined) {
    if (nct.bcd_path === '') {
      // bcd_path for this feature not yet known - nothing to do
      return;
    }
    else if (Array.isArray(nct.bcd_path)) {
      for (const bpath of nct.bcd_path) {
        updatePath(nct, bpath);
      }
    }
    else {
      updatePath(nct, nct.bcd_path);
    }
  }
  else {
    for (const child of Object.values(nct)) {
      updateAll(child);
    }
  }
}

const nct = utils.readJsonSync(nctFile);
updateAll(nct);
