import React from 'react';
import ReactDOM from 'react-dom/client';
import './theme.css';

const params = new URLSearchParams(window.location.search);
const memoId = params.get('memo');

if (memoId) {
  // 메모 floating 창
  import('./MemoWindow').then(({ MemoWindow, trackMemoRect }) => {
    void trackMemoRect(memoId);
    ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
      <MemoWindow id={memoId} />,
    );
  });
} else {
  // 메인 창 — 영속 상태 로드 후 렌더
  Promise.all([import('./App'), import('./store'), import('./ErrorBoundary')]).then(
    ([{ default: App }, { useApp }, { ErrorBoundary }]) => {
      useApp
        .getState()
        .hydrate()
        .finally(() => {
          ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
            <React.StrictMode>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </React.StrictMode>,
          );
        });
    },
  );
}
