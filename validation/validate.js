#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function usage() {
  console.error('Usage: node validation/validate.js <file> [--type full|summary]');
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length === 0) usage();

const filePath = args[0];
let type = 'full';

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--type') {
    type = args[i + 1] || '';
    i++;
  }
}

if (type !== 'full' && type !== 'summary') {
  console.error(`Invalid --type: ${type}`);
  usage();
}

let raw;
try {
  raw = fs.readFileSync(filePath, 'utf8');
} catch (err) {
  console.error(`Failed to read file: ${filePath}`);
  console.error(err && err.message ? err.message : String(err));
  process.exit(1);
}

let json;
try {
  json = JSON.parse(raw);
} catch (err) {
  console.error('Invalid JSON');
  console.error(err && err.message ? err.message : String(err));
  process.exit(1);
}

const errors = [];

function requireKey(obj, key, label) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    errors.push(`${label} must be an object`);
    return;
  }
  if (!(key in obj)) errors.push(`Missing required key: ${key}`);
}

function checkComponent(name) {
  if (!(name in json)) return;
  const comp = json[name];
  if (!comp || typeof comp !== 'object' || Array.isArray(comp)) {
    errors.push(`${name} must be an object`);
    return;
  }
  if ('_component' in comp && comp._component !== name) {
    errors.push(`${name}._component must be "${name}"`);
  }
}

requireKey(json, 'meta', 'root');

if (type === 'full') {
  ['identity', 'narrative', 'voice', 'commercial', 'governance'].forEach((k) => requireKey(json, k, 'root'));
} else {
  ['identity', 'narrative', 'voice'].forEach((k) => requireKey(json, k, 'root'));
}

['identity', 'narrative', 'voice', 'commercial', 'governance'].forEach(checkComponent);

if (errors.length) {
  console.error('Validation failed:');
  errors.forEach((e) => console.error(`- ${e}`));
  process.exit(1);
}

console.log('OK');
