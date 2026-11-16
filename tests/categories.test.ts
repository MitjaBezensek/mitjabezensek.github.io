import assert from 'node:assert/strict';
import test from 'node:test';
import { categoryLabel, canonicalCategorySlug, categoryTopics } from '../src/lib/categories.ts';

test('category labels preserve technical names and use sentence case', () => {
  assert.equal(categoryLabel('csharp'), 'C#');
  assert.equal(categoryLabel('dotnet'), '.NET');
  assert.equal(categoryLabel('vsto'), 'VSTO');
  assert.equal(categoryLabel('theory-of-computation'), 'Theory of computation');
});

test('duplicate Excel topics share one destination without changing other slugs', () => {
  assert.equal(canonicalCategorySlug('excel excel'), 'excel');
  assert.equal(canonicalCategorySlug('excel-bug'), 'excel-bug');
  assert.deepEqual(categoryTopics(['excel', 'excel excel', 'csharp']), [
    { slug: 'excel', name: 'Excel' }, { slug: 'csharp', name: 'C#' },
  ]);
});
