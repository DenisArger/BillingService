const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('core files exist', () => {
  assert.ok(fs.existsSync('src/index.ts'));
  assert.ok(fs.existsSync('src/routes.ts'));
  assert.ok(fs.existsSync('drizzle.config.ts'));
});
