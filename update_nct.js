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

function varr(v) {
  return v.split('.').map(n => parseInt(n));
}

function vcmp(v1, v2) {
  const a1 = varr(v1);
  const a2 = varr(v2);
  for (const i in a1) {
    if (a1[i] < a2[i]) return -1;
    if (a1[i] > a2[i]) return +1;
  }
  return 0;
}

const flags = ['', '--harmony'];
const bounds = ['version_added', 'version_removed'];

const v8dir = path.join(nctDir, 'results/v8/');

const tree = utils.readJsonSync(nctFile);

const files = Object.create(null);

for (const name of fs.readdirSync(v8dir)) {
  const match = /([0-9]+\.[0-9]+\.[0-9]+)(--harmony)?\.json/.exec(name);
  if (match) {
    const ver = match[1];
    const flag = match[2] === undefined ? '' : match[2];
    if (! files[ver]) files[ver] = Object.create(null);
    files[ver][flag] = name;
  }
}

const versions = Object.keys(files);

versions.sort(vcmp);

// reset data
for (const node of leafs(tree)) {
  for (const flag of flags) node[flag] = Object.create(null);
}

function vset(tree, ver, ok, ...path) {
  const first = path.shift();
  const node = tree[first];
  if (node === undefined) return;
  if (path.length === 0) {
    if (ok) {
      if (! node.version_added) {
        node.version_added = ver;
      }
      else if (node.version_added && node.version_removed) {
        // Feature was added, removed, added again. Keep only latest data.
        node.version_added = ver;
        delete node.version_removed;
      }
    }
    else {
      if (node.version_added && ! node.version_removed) {
        node.version_removed = ver;
      }
    }
  }
  else {
    vset(node, ver, ok, ...path);
  }
}

for (const ver of versions) {
  for (const flag of flags) {
    const name = files[ver][flag];

    // there's no --harmony file for some 0.12.x versions
    if (name === undefined && ver.startsWith('0.12.')) continue;

    const file = path.join(v8dir, name);
    const nct = utils.readJsonSync(file);
    for (const [tag, data] of Object.entries(nct)) {

      // skip _version, _engine
      if (tag.startsWith('_')) continue;

      for (const [key, val] of Object.entries(data)) {

        // skip _successful, _count, _percent
        if (key.startsWith('_')) continue;

        const parts = key.split('›');
        vset(tree, ver, val === true, tag, ...parts, flag);
      }
    }
  }
}

function veq(d1, d2) {
  for (const bound of bounds) {
    if (d1[bound] !== d2[bound]) return false;
  }
  return true;
}

for (const node of leafs(tree)) {

  // remove patch version from 0.x versions - too many changes
  for (const flag of flags) {
    for (const bound of bounds) {
      const ver = node[flag][bound];
      if (ver && ver.startsWith('0.')) {
        node[flag][bound] = varr(ver).slice(0, 2).join('.');
      }
    }
  }

  // if versions are equal with or without flag, flag has no effect - delete it
  if (node['--harmony'] && veq(node[''], node['--harmony'])) delete node['--harmony'];
  // if feature is only available with flag, delete no-flag data
  if (node['--harmony'] && veq(node[''], {})) delete node[''];
}

utils.writeJsonSync(nctFile, tree);
