import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = ts.transpileModule(readFileSync(new URL('../src/services/session.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { hasActiveSession } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const token = exp => `header.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.signature`;
test('Landing access distinguishes missing, malformed, expired and active sessions', () => {
  assert.equal(hasActiveSession(null, 1000), false);
  assert.equal(hasActiveSession('invalid', 1000), false);
  assert.equal(hasActiveSession(token(1), 1000), false);
  assert.equal(hasActiveSession(token(2), 1000), true);
  assert.equal(hasActiveSession(token('2'), 1000), false);
});
