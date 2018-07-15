"use strict";

const fs = require('fs');

let nctDir = process.argv[2];
let nctFile = process.argv[3];
if (! nctDir || ! nctFile) {
  const cmd = process.argv[1].split('\\').pop().split('/').pop();
  console.log('Usage:');
  console.log(`node ${cmd} nct-dir nct-file`);
  console.log('Example:');
  console.log(`node ${cmd} node-compat-table nct.json`);
  console.log('parse data in node-compat-table/testers.json, write result into nct.json');
  return;
}

if (! nctDir.endsWith('/')) nctDir += '/';

function readKeys(path) {
  const json = fs.readFileSync(path, 'utf8');
  const obj = JSON.parse(json);
  
  const keys = Object.create(null);
  for (const [tag, data] of Object.entries(obj)) {
    if (tag.startsWith('_')) continue;
    for (const key of Object.keys(data)) {
      if (key.startsWith('_')) continue;
      if (keys[key] !== undefined) throw new Error('duplicate key '+key);
      keys[key] = null;
    }
  }

  return Object.keys(keys);
}

const keys = readKeys(nctDir + 'testers.json');
