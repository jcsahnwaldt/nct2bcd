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
    Parse data in node-compat-table/results/v8/*.json,
    write result into nct.json.`;
  console.log(usage);
  return;
}

//
// global constants
//

const flags = ['', '--harmony'];
const bounds = ['version_added', 'version_removed'];
const v8dir = path.join(nctDir, 'results/v8/');

//
// functions dealing with version strings and nodes
//

// split version string into array with given number of parts
function varr(v, n) {
  const a = v.split('.');
  while (a.length < n) a.push(0);
  while (a.length > n) a.pop();
  return a.map(n => parseInt(n));
}

// rebuild version string with given number of parts
function vclean(v, n) {
  return varr(v, n).join('.');
}

// compare given number of parts of version strings
function vcmp(v1, v2, n) {
  const a1 = varr(v1, n);
  const a2 = varr(v2, n);
  for (const i in a1) {
    if (a1[i] < a2[i]) return -1;
    if (a1[i] > a2[i]) return +1;
  }
  return 0;
}

// do version nodes contain equal version data?
function veq(n1, n2) {
  for (const bound of bounds) {
    if (n1[bound] !== n2[bound]) return false;
  }
  return true;
}

// update version data in node if necessary
// Note: this only works when called with versions in ascending order!
function vset(node, ver, ok) {
  if (ok) {
    if (! node.version_added) {
      // Feature was added in this version
      node.version_added = ver;
    }
    else if (node.version_added && node.version_removed) {
      // Feature was added, removed, now added again. Keep only latest data.
      node.version_added = ver;
      delete node.version_removed;
    }
  }
  else {
    if (node.version_added && ! node.version_removed) {
      // Feature was removed in this version
      node.version_removed = ver;
    }
  }
}

//
// functions dealing with v8/*.json files
//

// load v8/*.json file
function nctJson(name) {
  const file = path.join(v8dir, name);
  return utils.readJsonSync(file);
}

// build version -> file map
function nctFiles() {
  const files = Object.create(null);
  for (const name of fs.readdirSync(v8dir)) {
    const match = /([0-9]+\.[0-9]+\.[0-9]+|nightly)(--harmony)?\.json/.exec(name);
    if (match) {
      let ver = match[1];
      const flag = match[2] === undefined ? '' : match[2];
      if (ver == 'nightly') {
        const data = nctJson(name);
        ver = vclean(data._version, 3);
      }
      if (! files[ver]) files[ver] = Object.create(null);
      files[ver][flag] = name;
    }
  }
  return files;
}

//
// functions dealing with nodes in data tree
//

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

// find node in tree
function *find(tree, ...path) {
  const first = path.shift();
  const node = tree[first];
  if (node === undefined) return;
  if (path.length === 0) yield node;
  else yield *find(node, ...path);
}

// clear version nodes in tree
function clear(tree) {
  for (const node of leafs(tree)) {
    for (const flag of flags) {
      node[flag] = Object.create(null);
    }
  }
}

// temporary function
function new_bcd_path(bpath) {
  return 'javascript.' + bpath.replace(/\//g, '.');
}

// clean up version nodes in tree
function clean(tree) {
  for (const node of leafs(tree)) {

    // temporary code
    if (Array.isArray(node.bcd_path)) {
      for (const i in node.bcd_path) {
        node.bcd_path[i] = new_bcd_path(node.bcd_path[i]);
      }
    }
    else if (node.bcd_path) {
      node.bcd_path = new_bcd_path(node.bcd_path);
    }

    // remove patch version from 0.x versions - too many changes
    for (const flag of flags) {
      for (const bound of bounds) {
        const ver = node[flag][bound];
        if (ver && ver.startsWith('0.')) {
          node[flag][bound] = vclean(ver, 2);
        }
      }
    }
    // if versions are equal with or without flag, flag has no effect - delete it
    if (node['--harmony'] && veq(node[''], node['--harmony'])) delete node['--harmony'];
    // if feature is only available with flag, delete no-flag data
    if (node['--harmony'] && veq(node[''], {})) delete node[''];
  }
}

//
// main program
//

const files = nctFiles();
const versions = Object.keys(files);
versions.sort((v1, v2) => vcmp(v1, v2, 3));

const tree = utils.readJsonSync(nctFile);

clear(tree);

// read version data from files, update version tree
for (const ver of versions) {
  if (vcmp(ver, "4.0.0") < 0) continue;
  for (const flag of flags) {
    const name = files[ver][flag];
    // there's no --harmony file for some 0.12.x versions
    if (name === undefined && ver.startsWith('0.12.')) continue;
    const nct = nctJson(name);
    for (const [tag, data] of Object.entries(nct)) {
      if (tag.startsWith('_')) continue; // skip _version, _engine
      for (const [key, val] of Object.entries(data)) {
        if (key.startsWith('_')) continue; // skip _successful, _count, _percent
        const parts = key.split('›');
        for (const node of find(tree, tag, ...parts, flag)) {
          vset(node, ver, val === true);
        }
      }
    }
  }
}

clean(tree);

utils.writeJsonSync(nctFile, tree);
