import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintFindings } from '../../common/test-helpers.js';

const folder = `${import.meta.dirname}/..`;

// The same rules as the COOP demo. This login reads neither popup.closed nor
// window.opener, so lint finds nothing.
test('lint finds no window relationship', async () => {
  assert.deepEqual(await lintFindings(folder), []);
});
