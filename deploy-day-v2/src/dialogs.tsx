// 인앱 다이얼로그/토스트 — window.prompt/alert/confirm 대체.
// (Tauri 네이티브 다이얼로그는 못생기고 테스트 불가 → CLI 톤 인앱 모달)
import { create } from 'zustand';
import { useState, useEffect } from 'react';

type DialogKind = 'prompt' | 'confirm' | 'alert';

interface DialogReq {
  kind: DialogKind;
  title: string;
  message?: string;
  initial?: string;
  okLabel?: string;
  resolve: (v: string | boolean | null) => void;
}

interface DialogStore {
  dialog: DialogReq | null;
  toast: string | null;
  open: (d: DialogReq) => void;
  close: () => void;
  showToast: (m: string) => void;
}

const useDialogStore = create<DialogStore>((set) => ({
  dialog: null,
  toast: null,
  open: (d) => set({ dialog: d }),
  close: () => set({ dialog: null }),
  showToast: (m) => set({ toast: m }),
}));

// Promise 기반 헬퍼
export const uiPrompt = (title: string, initial = '', message?: string): Promise<string | null> =>
  new Promise((resolve) =>
    useDialogStore.getState().open({ kind: 'prompt', title, message, initial, resolve: resolve as any }),
  );

export const uiConfirm = (title: string, okLabel = '확인'): Promise<boolean> =>
  new Promise((resolve) =>
    useDialogStore.getState().open({ kind: 'confirm', title, okLabel, resolve: resolve as any }),
  );

export const uiAlert = (title: string): Promise<void> =>
  new Promise((resolve) =>
    useDialogStore.getState().open({ kind: 'alert', title, resolve: () => resolve() }),
  );

export const uiToast = (m: string) => {
  useDialogStore.getState().showToast(m);
  setTimeout(() => {
    if (useDialogStore.getState().toast === m) useDialogStore.getState().showToast('');
  }, 2200);
};

// 앱 루트에 한 번 마운트
export function DialogHost() {
  const dialog = useDialogStore((s) => s.dialog);
  const toast = useDialogStore((s) => s.toast);
  const close = useDialogStore((s) => s.close);
  const [v, setV] = useState('');

  useEffect(() => {
    if (dialog?.kind === 'prompt') setV(dialog.initial ?? '');
  }, [dialog]);

  const finish = (result: string | boolean | null) => {
    dialog?.resolve(result);
    close();
  };

  return (
    <>
      {dialog && (
        <div className="modal-scrim" onMouseDown={() => finish(dialog.kind === 'confirm' ? false : null)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-title mono c-txt">{dialog.title}</div>
            {dialog.message && <div className="modal-msg kr c-dim">{dialog.message}</div>}
            {dialog.kind === 'prompt' && (
              <div className="promptrow" style={{ border: '1px solid var(--border)', borderRadius: 5, marginTop: 12 }}>
                <span className="caret">❯</span>
                <input
                  className="kr"
                  autoFocus
                  value={v}
                  maxLength={120}
                  onChange={(e) => setV(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && v.trim()) finish(v);
                    if (e.key === 'Escape') finish(null);
                  }}
                />
              </div>
            )}
            <div className="modal-actions">
              {dialog.kind !== 'alert' && (
                <span className="iconbtn mono" onClick={() => finish(dialog.kind === 'confirm' ? false : null)}>취소</span>
              )}
              <span
                className="mono c-accent"
                style={{ fontWeight: 700, cursor: 'pointer', padding: '2px 8px' }}
                onClick={() => {
                  if (dialog.kind === 'prompt') { if (v.trim()) finish(v); }
                  else if (dialog.kind === 'confirm') finish(true);
                  else finish(null);
                }}
              >
                {dialog.okLabel ?? '확인'}
              </span>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast mono">⏺ {toast}</div>}
    </>
  );
}
