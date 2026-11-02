const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const match = source.match(/const today=(.+?);const uid=/s);
assert.ok(match, 'app.js must define today() before uid()');

function dateAt(utcTimestamp) {
  const NativeDate = Date;
  class FixedDate extends NativeDate {
    constructor(...args) { super(...(args.length ? args : [utcTimestamp])); }
  }
  return vm.runInNewContext(`const today=${match[1]};today()`, { Date: FixedDate });
}

test('uses Brazilian local date around the UTC day boundary', () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = 'America/Sao_Paulo';
    assert.equal(dateAt('2026-11-03T01:00:00Z'), '2026-11-02');
    assert.equal(dateAt('2026-11-03T03:01:00Z'), '2026-11-03');
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
