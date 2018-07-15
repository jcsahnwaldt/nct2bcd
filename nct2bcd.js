"use strict";

const fs = require('fs');

const bcd = './browser-compat-data';

function *paths(dir) {
  if (! dir.endsWith('/')) dir += '/';
  const names = fs.readdirSync(dir);
  for (const name of names) {
    const path = dir + name;
    const stats = fs.lstatSync(path);
    if (stats.isDirectory()) {
      yield *paths(path);
    }
    else if (stats.isFile()) {
      yield path;
    }
  }
}

for (const path of paths(bcd + '/javascript')) {
  console.log(path);
  const json = fs.readFileSync(path, 'utf8');
  const obj = JSON.parse(json, (key, value) => {
    return key === '__compat' ? null : value;
  });
  console.dir(obj, {depth: null});
}