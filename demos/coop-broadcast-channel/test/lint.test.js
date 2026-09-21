import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintFindings } from '../../common/test-helpers.js';

const folder = `${import.meta.dirname}/..`;

test('lint finds no window relationship', async () => {
  assert.deepEqual(await lintFindings(folder), []);
});
