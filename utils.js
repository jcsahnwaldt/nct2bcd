"use strict";

const fs = require('fs');

function readJsonSync(file, optional) {
  try {
    const json = fs.readFileSync(file, 'utf8');
    return JSON.parse(json);
  }
  catch (e) {
    if (optional !== true || e.code !== 'ENOENT') throw e;
    return Object.create(null);
  }
}

function writeJsonSync(file, data) {
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(file, json, 'utf8');
}

module.exports = {
  readJsonSync,
  writeJsonSync
};