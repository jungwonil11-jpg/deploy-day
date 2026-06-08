// 앱 셸 — 시작 배너 + 어나운스 라인 + 탭 + status line. (v1 home_screen.dart 포팅)
import { useEffect } from 'react';
import { useApp } from './store';
import { personaOf, pfmt } from './persona';
// personaOf 사용 (App 내 여러 곳)
import { isShipDay, daysToShip, verStr, kDayKr, kDayEn } from './types';
import { listen } from '@tauri-apps/api/event';
import type { Memo } from './types';
import { SprintTab } from './tabs/SprintTab';
import { BacklogTab } from './tabs/BacklogTab';
import { ChangelogTab } from './tabs/ChangelogTab';
import { MemoTab } from './tabs/MemoTab';
import { ConfigTab } from './tabs/ConfigTab';
import { DialogHost, uiPrompt, uiToast } from './dialogs';
import { ClawdLogo } from './Clawd';
import { TutorialOverlay } from './TutorialOverlay';
import { useTutorial } from './tutorial';

export default function App() {
  const s = useApp((st) => st.s);
  const tab = useApp((st) => st.tab);
  const setTab = useApp((st) => st.setTab);
  const setName = useApp((st) => st.setName);
  const p = personaOf(s);

  // 다크/라이트 → :root data-theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', s.dark ? 'dark' : 'light');
  }, [s.dark]);

  // 첫 실행 이름 온보딩 → 튜토리얼 자동 시작 (인앱 다이얼로그)
  useEffect(() => {
    if (!s.name) {
      uiPrompt('✻ Welcome to deploy-day!', '', p.onboard).then((v) => {
        if (v) {
          setName(v);
          setTimeout(() => useTutorial.getState().start(), 400);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 메모 창 → 메인 이벤트 배선 + 시작 시 복원 (메인은 유일 writer)
  useEffect(() => {
    const st = useApp.getState();
    const uns = [
      listen<{ id: string; patch: Partial<Memo> }>('memo-patch', (e) => st.patchMemo(e.payload.id, e.payload.patch)),
      listen<{ id: string }>('memo-closed', (e) => st.markMemoClosed(e.payload.id)),
      listen<{ text: string; project?: string | null }>('memo-to-commit', (e) => { st.addTodoTo(e.payload.text, e.payload.project ?? null); uiToast(personaOf(st.s).ui.memoSent); }),
      listen('tray-new-memo', () => { void st.newMemo(); }),
    ];
    void st.restoreMemos();
    return () => { uns.forEach((u) => u.then((f) => f())); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs: [string, string, React.ReactNode][] = [
    ['/sprint', `${s.todos.length}`, <SprintTab key="s" />],
    ['/backlog', `${s.backlog.length}`, <BacklogTab key="b" />],
    ['/changelog', `${s.releases.length}`, <ChangelogTab key="c" />],
    ['/memo', `${s.memos.length}`, <MemoTab key="m" />],
    ['/config', '', <ConfigTab key="cfg" />],
  ];

  const recent = [...s.releases].reverse().slice(0, 3);

  // 어나운스 라인
  const today = isShipDay(s.shipDay);
  const dd = daysToShip(s.shipDay);
  const doneN = s.todos.filter((t) => t.done).length;
  const v = { streak: s.streak, ver: verStr(s.major, s.minor + 1), d: dd, day: kDayKr[s.shipDay] };
  let aColor = 'var(--accent)';
  let head: string;
  let rest: string;
  if (today && s.streak > 0 && doneN === 0) {
    aColor = 'var(--rollback)'; head = pfmt(p.riskHead, v); rest = pfmt(p.riskRest, v);
  } else if (dd === 1 && doneN === 0 && s.todos.length > 0) {
    aColor = 'var(--warn)'; head = pfmt(p.warnHead, v); rest = pfmt(p.warnRest, v);
  } else if (today) {
    head = pfmt(p.todayHead, v); rest = pfmt(p.todayRest, v);
  } else {
    head = pfmt(p.normalHead, v); rest = pfmt(p.normalRest, v);
  }

  return (
    <div className="app-root">
      <div className="app-scroll">
      <div className="app-col">
        {/* 시작 배너 */}
        <div className="clibox" style={{ marginTop: 22 }}>
          <div className="clibox-body" style={{ borderColor: 'var(--accent)', padding: '16px 18px', display: 'flex', gap: 20 }}>
            <div style={{ flex: 5, textAlign: 'center' }}>
              <div
                className="mono c-txt"
                style={{ fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                onClick={() => { uiPrompt(p.ui.nameChange, s.name).then((n) => { if (n) setName(n); }); }}
              >
                Welcome back {s.name || '...'}!
              </div>
              <div data-tut="clawd"><ClawdLogo foundMsg={p.ui.clawd} /></div>
              <div className="mono c-dim" style={{ fontSize: 12 }}>인생 배포 · 매주 {kDayKr[s.shipDay]}요일</div>
              <div className="mono" style={{ fontSize: 12, marginTop: 4 }} data-tut="streak">
                streak {s.streak}주 · <span className="c-ship">● LIVE</span>
              </div>
            </div>
            <div style={{ flex: 6 }}>
              <div className="mono c-accent" style={{ fontSize: 13, fontWeight: 700 }}>Tips for getting started</div>
              <div className="kr" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{pfmt(p.tips, { day: kDayKr[s.shipDay] })}</div>
              <div style={{ height: 12, borderBottom: '1px solid var(--accent)', marginBottom: 12 }} />
              <div className="mono c-accent" style={{ fontSize: 13, fontWeight: 700 }}>What's new</div>
              {recent.length === 0 ? (
                <div className="kr c-dim" style={{ fontSize: 13, marginTop: 6 }}>아직 릴리즈 없음 — 첫 배포가 첫 뉴스임</div>
              ) : (
                recent.map((r, i) => (
                  <div key={i} className="kr" style={{ fontSize: 13, marginTop: 2 }}>
                    {verStr(r.major, r.minor)}{r.title ? ` ${r.title}` : ''} · {r.date}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 어나운스 */}
        <div className="announce mono" style={{ borderLeftColor: aColor }}>
          <span style={{ color: aColor, fontWeight: 700 }}>{head}</span>
          <span className="c-dim">{rest}</span>
        </div>

        {/* 탭 */}
        <div className="tabs">
          {tabs.map(([label, cnt], i) => (
            <div key={label} data-tut={`tab-${i}`} className={`tab mono${tab === i ? ' on' : ''}`} onClick={() => setTab(i)}>
              {label}{cnt && <span className="cnt"> {cnt}</span>}
            </div>
          ))}
        </div>

        <div style={{ height: 16 }} />
        {tabs[tab]?.[2]}
      </div>
      </div>

      {/* status line — 고정 오버레이가 아니라 실제 푸터(스크롤 영역 아래) */}
      <div className="statusline" data-tut="statusline">
        <div className="row1">
          <span className="c-blue" style={{ fontWeight: 700 }}>deploy-day {verStr(s.major, s.minor)} (1주 cycle)</span>
          <span className="c-dimmer"> · streak {s.streak}주 · </span>
          <span className="c-magenta" style={{ fontWeight: 700 }}>main</span>
          <span className="spacer" />
        </div>
        <div style={{ marginTop: 3 }}>
          <span className="c-pink" style={{ fontWeight: 700 }}>⏵⏵ deploy mode on</span>
          <span className="c-pink"> (every {kDayEn[s.shipDay]})</span>
          <span className="c-dimmer">{today ? ' · 🚀 today' : ` · D-${daysToShip(s.shipDay)} for ship`}</span>
        </div>
      </div>

      <DialogHost />
      <TutorialOverlay />
    </div>
  );
}
