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

const v8dir = path.join(nctDir, 'results/v8/');

const tree = utils.readJsonSync(nctFile);

const versions = Object.create(null);

const names = fs.readdirSync(v8dir);
for (const name of names) {
  const match = /([0-9]+\.[0-9]+\.[0-9]+)(--harmony)?\.json/.exec(name);
  if (match) {
    const ver = match[1];
    const flag = match[2] === undefined ? '' : match[2];
    if (! versions[ver]) versions[ver] = Object.create(null);
    versions[ver][flag] = name;
  }
}

let keys = Object.keys(versions);
keys.sort(vcmp);

const flags = ['', '--harmony'];

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

function vadd(tree, doadd, ver, ok, ...path) {
  const first = path.shift();
  if (path.length === 0) {
    if (tree[first] === undefined) tree[first] = Object.create(null);
    const data = tree[first];
    if (ok) {
      if (! data.version_added) {
        data.version_added = ver;
      }
      else if (data.version_added && data.version_removed) {
        // feature was added, later removed, then added again.
        // Let's keep only the latest data.
        data.version_added = ver;
        delete data.version_removed;
      }
    }
    else {
      if (data.version_added && ! data.version_removed) data.version_removed = ver;
    }
  }
  else {
    if (tree[first] === undefined) {
      if (doadd) tree[first] = Object.create(null);
      else return;
    }
    vadd(tree[first], doadd, ver, ok, ...path);
  }
}

for (const ver of keys) {

  let doadd = true;
  if (ver === '0.12.18' || ver === '0.10.48') {
    doadd = false;
  }
  else if (ver.startsWith('0.')) {
    continue;
  }

  for (const flag of flags) {
    const name = versions[ver][flag];
    if (name === undefined) continue;
    const file = path.join(v8dir, name);
    const nct = utils.readJsonSync(file);
    for (const [tag, data] of Object.entries(nct)) {
      if (tag.startsWith('_')) continue;
      for (const [key, val] of Object.entries(data)) {
        if (key.startsWith('_')) continue;
        const parts = key.split('›');
        if (doadd) add(tree, '', tag, ...parts, 'bcd_path');
        vadd(tree, doadd, ver, val === true, tag, ...parts, flag);
      }
    }
  }
}

function veq(d1, d2) {
  return d1.version_added === d2.version_added && d1.version_removed === d2.version_removed;
}

function vclean(tree) {
  if (tree.bcd_path !== undefined) {
    // if versions are equal with or without flag, delete flag data (flag has no effect)
    if (tree['--harmony'] && veq(tree[''], tree['--harmony'])) delete tree['--harmony'];
    // if feature is only available with flag, delete no-flag data
    if (tree['--harmony'] && veq(tree[''], {})) delete tree[''];
  }
  else {
    for (const node of Object.values(tree)) {
      vclean(node);
    }
  }
}

vclean(tree);

utils.writeJsonSync(nctFile, tree);
