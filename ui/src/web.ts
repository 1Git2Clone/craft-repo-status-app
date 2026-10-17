// The host API in a plain browser (GitHub Pages, `make preview`): the data is
// ./snapshot.json, which the Pages workflow rewrites on a schedule. Refresh
// re-fetches it; the desktop-only controls are hidden (`.web` in style.css).

import type { Api } from './app.ts';
import type { Meta, Snapshot } from './model.ts';

export function webApi(win: Window, load: () => Promise<Snapshot>): Api {
  win.document.documentElement.classList.add('web');
  let onSnapshot: ((s: Snapshot) => void) | undefined;
  return {
    async invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
      if (cmd === 'get_snapshot') return load() as Promise<T>;
      if (cmd === 'get_meta') return { opacity: 1, always_on_top: false, shortcut: '' } satisfies Meta as T;
      if (cmd === 'refresh_now') await load().then((s) => onSnapshot?.(s), (e: unknown) => console.warn(e));
      if (cmd === 'open_url') win.open(String(args?.url), '_blank');
      return null as T;
    },
    listen<T>(event: string, fn: (payload: T) => void): void {
      if (event === 'craft:snapshot') onSnapshot = fn as (s: Snapshot) => void;
    },
    startResize() {},
  };
}
