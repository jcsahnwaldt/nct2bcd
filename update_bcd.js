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
    Read data from nct.json and bcd.json, update files in browser-compat-data.`;
  console.log(usage);
  return;
}

//
// global constants
//

const flags = ['', '--harmony'];
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

function copyVersions(target, source) {
  target.version_added = source.version_added;
  target.version_removed = source.version_removed;
}

// update bcd support node
// support: bcd support node, e.g. {nodejs: {version_added: "6.0.0"} }
// versions: versions node, e.g. { version_added: "6.0.0", version_removed: "7.0.0" }
function updateSupport(support, versions) {
  const nodejs = support.nodejs;
  if (! nodejs) {
    support.nodejs = versions;
  }
  else if (Array.isArray(nodejs)) {
    for (const i in nodejs) {
      if (feq(nodejs[i].flags, versions.flags)) {
        copyVersions(nodejs[i], versions);
        return;
      }
    }
    nodejs.push(versions);
  }
  else if (feq(nodejs.flags, versions.flags)) {
    copyVersions(support.nodejs, versions);
  }
  else {
    support.nodejs = [nodejs, versions];
  }
}

// update bcd file
// bpath: bcd path, e.g. "javascript.builtins.Array.concat"
// flag: flag, i.e. '' or '--harmony'
// versions: object with 'version_added' and/or 'version_removed' properties
function updateFile(nct, bpath) {
  if (map[bpath] === undefined) throw new Error('invalid BCD path ' + bpath);
  const file = path.join(bcdDir, map[bpath].bcd_file);

  const bcd = utils.readJsonSync(file);

  const support = find(bcd, ...bpath.split('.'), '__compat', 'support');
  if (support === undefined) throw new Error('invalid BCD path ' + bpath);

  for (const flag of flags) {
    if (nct[flag]) {
      const versions = nct[flag];
      if (versions.version_added === undefined) versions.version_added = false;
      if (flag !== '') versions.flags = [ { type: 'runtime_flag', name: flag } ];
      updateSupport(support, versions);
    }
  }

  utils.writeJsonSync(file, bcd);
}

function updateFiles(nct) {
  if (nct.bcd_path !== undefined) {
    if (nct.bcd_path === '') {
      // bcd_path for this feature not yet known - nothing to do
      return;
    }
    else if (Array.isArray(nct.bcd_path)) {
      for (const bpath of nct.bcd_path) {
        updateFile(nct, bpath);
      }
    }
    else {
      updateFile(nct, nct.bcd_path);
    }
  }
  else {
    for (const branch of Object.values(nct)) {
      updateFiles(branch);
    }
  }
}

const nct = utils.readJsonSync(nctFile);
updateFiles(nct);
