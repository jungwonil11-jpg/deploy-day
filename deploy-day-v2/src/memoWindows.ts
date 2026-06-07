// 메모 floating 창 관리 — Tauri WebviewWindow.
// v1의 desktop_multi_window(엔진 per 창) 대신 Tauri 네이티브 창 → 안정적.
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { emit } from '@tauri-apps/api/event';
import type { Memo } from './types';

export const memoLabel = (id: string) => `memo-${id}`;

// 메모 창 생성 (이미 있으면 포커스만)
export async function openMemoWindow(m: Memo) {
  const label = memoLabel(m.id);
  const existing = await WebviewWindow.getByLabel(label);
  if (existing) {
    await existing.setFocus();
    return;
  }
  const w = new WebviewWindow(label, {
    url: `index.html?memo=${m.id}`,
    width: m.w,
    height: m.h,
    x: m.x,
    y: m.y,
    decorations: false, // 타이틀바 없음 (자체 미니 바)
    alwaysOnTop: m.pinned,
    skipTaskbar: true,
    resizable: true,
    title: `memo-${m.id}`,
    backgroundColor: '#1a1a1a',
  });
  w.once('tauri://error', (e) => {
    console.error('memo window error', e);
  });
}

// 메모 창 닫기 (삭제 시)
export async function closeMemoWindow(id: string) {
  const w = await WebviewWindow.getByLabel(memoLabel(id));
  if (w) await w.close();
}

// 모든 메모 창에 테마 전파
export async function broadcastMemoTheme(dark: boolean) {
  await emit('memo-theme', { dark });
}
