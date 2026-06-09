// 에러 경계 — 예기치 못한 오류로 앱이 깨질 때 사용자가 놀라지 않게 안내.
// 정책 안전: 오류 정보를 자동 전송하지 않음. 사용자가 [메일로 알리기]를 누를 때만
// mailto로 본인 메일 앱이 열림 (개인정보 수집·네트워크 전송 0 유지).
import { Component, type ReactNode, type ErrorInfo } from 'react';
import { useApp } from './store';
import type { Lang } from './types';

const ADMIN = 'jungwonil11@gmail.com';

// 크래시 화면 문구 (클래스 컴포넌트라 훅 대신 store 직접 조회)
const crashTxt = (lang: Lang) =>
  lang === 'en'
    ? {
        title: 'Something went wrong',
        desc: 'Your data is safe. Restart and you can pick up where you left off.',
        restart: 'Restart',
        mail: 'Report by email',
        footer: 'Error details are never sent automatically.',
        subject: '[deploy-day] Bug report',
        unknown: 'unknown',
        body:
          'The text below was filled in automatically. Sending it as-is helps.\n' +
          '(No personal info is included; feel free to edit or remove anything before sending.)\n\n' +
          'Error: {msg}\n\n' +
          'What happened (optional): describe what you were doing.\n',
      }
    : {
        title: '잠깐 문제가 생겼어요',
        desc: '데이터는 안전하게 저장돼 있어요. 다시 시작하면 이어서 쓸 수 있어요.',
        restart: '다시 시작',
        mail: '메일로 알리기',
        footer: '오류 정보는 자동으로 전송되지 않습니다.',
        subject: '[deploy-day] 오류 신고',
        unknown: '알 수 없음',
        body:
          '아래 내용은 자동으로 채워졌습니다. 그대로 보내주시면 도움이 됩니다.\n' +
          '(개인정보는 포함되어 있지 않으며, 보내기 전 자유롭게 수정/삭제하실 수 있습니다)\n\n' +
          '오류: {msg}\n\n' +
          '상황 (선택): 어떤 동작을 하다가 발생했는지 적어주세요.\n',
      };

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 로컬 콘솔에만 기록 (전송 없음)
    console.error('deploy-day error:', error, info.componentStack);
  }

  private mailReport = () => {
    const e = this.state.error;
    const t = crashTxt(useApp.getState().s.lang);
    const subject = encodeURIComponent(t.subject);
    const body = encodeURIComponent(t.body.replace('{msg}', e?.message ?? t.unknown));
    // mailto — 사용자의 기본 메일 앱이 열림 (앱이 직접 전송하지 않음)
    window.location.href = `mailto:${ADMIN}?subject=${subject}&body=${body}`;
  };

  private reload = () => window.location.reload();

  render() {
    if (!this.state.error) return this.props.children;
    const t = crashTxt(useApp.getState().s.lang);
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg, #0c0c0c)', color: 'var(--txt, #ececec)', fontFamily: "'JetBrains Mono','Consolas',monospace", padding: 24 }}>
        <div style={{ maxWidth: 460, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✻</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{t.title}</div>
          <div className="kr" style={{ fontSize: 14, color: 'var(--dim, #999)', lineHeight: 1.7, marginBottom: 8, fontFamily: "'Nanum Gothic Coding','Malgun Gothic',monospace" }}>
            {t.desc}
          </div>
          <div className="kr" style={{ fontSize: 12, color: 'var(--dimmer, #5c5c5c)', marginBottom: 20, fontFamily: "'Nanum Gothic Coding','Malgun Gothic',monospace" }}>
            {this.state.error.message}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={this.reload} style={btn(true)}>{t.restart}</button>
            <button onClick={this.mailReport} style={btn(false)}>{t.mail}</button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--dimmer, #5c5c5c)', marginTop: 14 }}>
            {t.footer}
          </div>
        </div>
      </div>
    );
  }
}

const btn = (primary: boolean): React.CSSProperties => ({
  padding: '9px 16px',
  borderRadius: 5,
  cursor: 'pointer',
  fontFamily: "'JetBrains Mono','Consolas',monospace",
  fontSize: 13,
  fontWeight: 700,
  border: primary ? 'none' : '1px solid var(--border, #3a3a3a)',
  background: primary ? 'var(--accent, #d97757)' : 'transparent',
  color: primary ? 'var(--bg, #0c0c0c)' : 'var(--dim, #999)',
});
