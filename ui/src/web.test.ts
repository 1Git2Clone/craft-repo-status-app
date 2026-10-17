// The browser host (web.ts) against a fake snapshot loader.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { webApi } from './web.ts';
import type { Snapshot } from './model.ts';

const snap = (poll_secs: number): Snapshot => ({
  repos: [], last_full_refresh_at: null, refreshing: false, next_refresh_at: null,
  poll_secs, stale_after_secs: poll_secs, rate_limit_remaining: null, error: null,
});

test('marks the page as web and serves the loaded snapshot', async () => {
  const win = new Window();
  const api = webApi(win as unknown as globalThis.Window, async () => snap(900));
  assert.ok(win.document.documentElement.classList.contains('web'));
  assert.equal((await api.invoke<Snapshot>('get_snapshot')).poll_secs, 900);
  assert.equal((await api.invoke<{ shortcut: string }>('get_meta')).shortcut, '');
  await win.happyDOM.close();
});

test('refresh re-fetches and pushes the new snapshot; a failed fetch keeps the old one', async () => {
  const win = new Window();
  let next: Promise<Snapshot> = Promise.resolve(snap(60));
  const api = webApi(win as unknown as globalThis.Window, () => next);
  const seen: number[] = [];
  api.listen<Snapshot>('craft:snapshot', (s) => seen.push(s.poll_secs));
  await api.invoke('refresh_now');
  next = Promise.reject(new Error('offline'));
  next.catch(() => {});
  await api.invoke('refresh_now');
  assert.deepEqual(seen, [60]);
  await win.happyDOM.close();
});
