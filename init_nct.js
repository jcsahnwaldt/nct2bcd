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

const testers = readKeys(nctDir + 'testers.json');
const v8_0_10_45 = readKeys(nctDir + 'results/v8/0.10.45.json');
const v8_10_6_0 = readKeys(nctDir + 'results/v8/10.6.0.json');

console.log(testers.length);

const v8dir = nctDir + 'results/v8/';
for (const name of fs.readdirSync(v8dir)) {
  if (name.startsWith('0.') || name === 'bleeding.json') continue;
  const path = v8dir + name;
  const keys = readKeys(path);
  let count = 0;
  for (const key of keys) {
    if (! testers.includes(key)) {
      console.log(key);
      count++;
    }
  }
  if (count !== 0) {
    console.log(path, keys.length, count);
  }
}
