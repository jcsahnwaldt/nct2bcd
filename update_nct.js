"use strict";

const fs = require('fs');
const path = require('path');

const nctDir = process.argv[2];
const nctFile = process.argv[3];
const bcdFile = process.argv[4];
const bcdDir = process.argv[5];
if (! nctDir || ! nctFile || ! bcdFile || ! bcdDir) {
  const cmd = path.basename(process.argv[1]);
  const usage =
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
    write results to browser-compat-data/javascript/{,**/}*.json.`;
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

let json = fs.readFileSync(nctFile, 'utf8');
const tree = JSON.parse(json);

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

// Note: Almost all node-compat-table/results/v8/*.json files
// have the same keys as node-compat-table/testers.json.
// Only the v8/0.*.json and the v8/bleeding.json files
// have different keys. Skip 0.*.json for now.
// TODO: find 0.10.x and 0.12.x files that work.
keys = keys.filter(v => ! v.startsWith('0.'));

const flags = ['', '--harmony'];

function vadd(tree, ver, ok, ...path) {
  const first = path.shift();
  if (path.length === 0) {
    if (tree[first] === undefined) tree[first] = Object.create(null);
    const data = tree[first];
    if (ok) {
      if (! data.version_added) data.version_added = ver;
      else if (data.version_added && data.version_removed) {
        // very special case for "Symbol.toStringTag affects existing built-ins":
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
    if (tree[first] === undefined) tree[first] = Object.create(null);
    vadd(tree[first], ver, ok, ...path);
  }
}

for (const ver of keys) {
  for (const flag of flags) {
    const file = path.join(v8dir, versions[ver][flag]);
    const json = fs.readFileSync(file, 'utf8');
    const nct = JSON.parse(json);
    for (const [tag, data] of Object.entries(nct)) {
      if (tag.startsWith('_')) continue;
      for (const [key, val] of Object.entries(data)) {
        if (key.startsWith('_')) continue;
        const parts = key.split('›');
        vadd(tree, ver, val === true, tag, ...parts, flag);
      }
    }
  }
}

function veq(d1, d2) {
  return d1.version_added === d2.version_added && d1.version_removed === d2.version_removed;
}

function vclean(tree) {
  if (tree.bcd_path !== undefined) {
    if (veq(tree[''], tree['--harmony'])) delete tree['--harmony'];
    if (veq(tree[''], {})) delete tree[''];
  }
  else {
    for (const node of Object.values(tree)) {
      vclean(node);
    }
  }
}

vclean(tree);

json = JSON.stringify(tree, null, 2);
fs.writeFileSync(nctFile, json, 'utf8');
