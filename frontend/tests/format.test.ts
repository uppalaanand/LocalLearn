import test from 'node:test';
import assert from 'node:assert/strict';
import { countLabel, ratingLabel } from '../src/utils/format';
test('counts preserve spaces and correct singular/plural forms', () => {
  for (const noun of ['student', 'participant', 'review', 'pending payment']) {
    assert.equal(countLabel(1, noun), `1 ${noun}`);
    assert.equal(countLabel(2, noun), `2 ${noun}s`);
    assert.equal(countLabel(0, noun), `0 ${noun}s`);
  }
});
test('unrated classes and teachers never display a zero badge', () => {
  assert.equal(ratingLabel(0), 'New');
  assert.equal(ratingLabel(NaN), 'New');
  assert.equal(ratingLabel(4.8, 0), 'New');
  assert.equal(ratingLabel(4.8, 10), '4.8');
});
