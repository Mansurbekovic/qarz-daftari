import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMoneyValue } from './helpers.js';

test('parses common money formats', () => {
  assert.equal(parseMoneyValue('1000'), 1000);
  assert.equal(parseMoneyValue('1.000'), 1000);
  assert.equal(parseMoneyValue('1,000'), 1000);
  assert.equal(parseMoneyValue('1.234,56'), 1234.56);
  assert.equal(parseMoneyValue('1,234.56'), 1234.56);
  assert.equal(parseMoneyValue('1000.50'), 1000.5);
});
