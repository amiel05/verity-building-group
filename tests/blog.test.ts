import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { posts, filterPosts } from '../src/lib/blog';
test('blog defaults to all articles newest first', () => {
  const results = filterPosts(new URLSearchParams());
  assert.equal(results.length, posts.length);
  assert.match(results[0].title, /Budget Planning/);
  assert.ok(results.every((p, i) => i === 0 || Date.parse(results[i - 1].date) >= Date.parse(p.date)));
});
test('topic and location intersect rather than widening results', () => {
  assert.equal(filterPosts(new URLSearchParams({topic:'Custom Home Construction'})).length, 2);
  assert.equal(filterPosts(new URLSearchParams({topic:'Custom Home Construction',location:'Charlotte'})).length, 1);
  assert.equal(filterPosts(new URLSearchParams({topic:'Land Development',location:'Charlotte'})).length, 0);
});
test('search is case insensitive, trims input, and combines with filters', () => {
  assert.equal(filterPosts(new URLSearchParams({q:'  BUDGET  '}))[0].location, 'Cornelius');
  assert.equal(filterPosts(new URLSearchParams({q:'budget',location:'Charlotte'})).length, 0);
  assert.equal(filterPosts(new URLSearchParams({q:'<script>alert(1)</script>'})).length, 0);
});

test('field guide sidebar uses its dark treatment and gold arrow-only CTA interaction', async () => {
  const styles = await readFile('src/styles/blog.css', 'utf8');

  assert.match(
    styles,
    /\.blog-sidebar\s*\{[^}]*background:\s*var\(--background-dark\);[^}]*color:\s*var\(--text-on-dark\);/s,
  );
  assert.match(
    styles,
    /\.blog-sidebar button\s*\{[^}]*background:\s*var\(--color-gold\);[^}]*white-space:\s*nowrap;/s,
  );
  assert.match(
    styles,
    /\.blog-sidebar button:is\(:hover, :focus-visible\) \.action-arrow\s*\{[^}]*left:\s*5px;/s,
  );
});
