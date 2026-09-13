import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function moduleUrl(source) {
  return `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  }).outputText).toString('base64')}`;
}
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const httpUrl = moduleUrl(readFileSync(new URL('../src/services/http.ts', import.meta.url), 'utf8').replace('import.meta.env.VITE_API_URL', "''"));
const { requestJson } = await import(httpUrl);
const { apiRequest } = await import(moduleUrl(readFileSync(new URL('../src/services/api.ts', import.meta.url), 'utf8').replace("'./http'", JSON.stringify(httpUrl))));

test('HTTP: errors cannot become successful writes; headers and JSON are preserved', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, '/api/comentarios');
      assert.equal(options.headers.get('Content-Type'), 'application/json');
      assert.equal(options.headers.get('X-Test'), 'preserved');
      return new Response(JSON.stringify({ id: '42' }), { status: 201 });
    };
    assert.deepEqual(await requestJson('/api/comentarios', { method: 'POST', body: '{}', headers: { 'X-Test': 'preserved' } }), { id: '42' });
    for (const status of [400, 422, 500]) {
      globalThis.fetch = async () => new Response('{}', { status });
      await assert.rejects(apiRequest('/comentarios', { method: 'POST', body: '{}' }, { id: 'fake' }), new RegExp(`HTTP ${status}`));
    }
    globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
    await assert.rejects(apiRequest('/comentarios', { method: 'POST', body: '{}' }, { id: 'fake' }));
    assert.deepEqual(await apiRequest('/comentarios', {}, []), { data: [], isFallback: true });
    globalThis.fetch = async () => new Response('invalid json', { status: 200 });
    await assert.rejects(requestJson('/api/comentarios'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
