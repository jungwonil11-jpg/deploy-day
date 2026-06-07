// /config — 테마·페르소나·사용법·소개·정책·백업.
import { useState } from 'react';
import { writeText, readText } from '@tauri-apps/plugin-clipboard-manager';
import { useApp } from '../store';
import { kPersonas, personaOf, pfmt } from '../persona';
import { broadcastMemoTheme } from '../memoWindows';
import { CliBox } from '../ui';
import { uiConfirm, uiToast } from '../dialogs';
import { useTutorial } from '../tutorial';
import { kManual, kPrivacyPolicy, kTerms } from '../legal';

function Foldable({ title, body, first }: { title: string; body: string; first?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: first ? 'none' : '1px solid var(--line)' }}>
      <div className="row" style={{ borderTop: 'none', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <span className="mono c-dim">{open ? '▾' : '▸'}</span>
        <span className="grow kr" style={{ fontSize: 14, color: open ? 'var(--txt)' : 'var(--dim)', fontWeight: 500 }}>{title}</span>
      </div>
      {open && <div className="kr c-dim" style={{ padding: '0 16px 16px', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{body}</div>}
    </div>
  );
}

export function ConfigTab() {
  const s = useApp((st) => st.s);
  const setDark = useApp((st) => st.setDark);
  const setPersona = useApp((st) => st.setPersona);
  const exportJson = useApp((st) => st.exportJson);
  const importJson = useApp((st) => st.importJson);
  const reset = useApp((st) => st.reset);

  const p = personaOf(s);
  const doExport = async () => {
    await writeText(exportJson());
    uiToast(p.ui.exportToast);
  };
  const doImport = async () => {
    const ok = await uiConfirm(p.ui.importAsk, '복원');
    if (!ok) return;
    try {
      importJson(await readText());
      uiToast(p.ui.importOk);
    } catch {
      uiToast(p.ui.importFail);
    }
  };
  const doReset = async () => {
    if (await uiConfirm(p.ui.resetAsk, '초기화')) { reset(); uiToast(p.ui.resetToast); }
  };

  return (
    <div>
      {/* 테마 */}
      <CliBox title="theme · 다크/라이트">
        <div style={{ display: 'flex' }}>
          {([['dark', '다크', true], ['light', '라이트', false]] as const).map(([k, label, dark], i) => {
            const on = s.dark === dark;
            return (
              <div
                key={k}
                onClick={() => { if (!on) { setDark(dark); void broadcastMemoTheme(dark); } }}
                style={{ flex: 1, textAlign: 'center', padding: '13px 0', cursor: 'pointer', background: on ? 'var(--panel2)' : 'transparent', borderLeft: i === 1 ? '1px solid var(--line)' : 'none' }}
                className="mono"
              >
                <span style={{ color: on ? 'var(--accent)' : 'var(--dimmer)' }}>{on ? '◉ ' : '○ '}</span>
                <span style={{ color: on ? 'var(--txt)' : 'var(--dim)', fontWeight: on ? 700 : 400 }}>{label}</span>
              </div>
            );
          })}
        </div>
      </CliBox>

      <div style={{ height: 16 }} />

      {/* 페르소나 */}
      <CliBox title="persona · 앱 말투 변경">
        {kPersonas.map((pp, i) => {
          const on = personaOf(s).id === pp.id;
          return (
            <div key={pp.id} className="row" style={{ borderTop: i === 0 ? 'none' : '1px solid var(--line)', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => { if (!on) { setPersona(pp.id); uiToast(`페르소나 변경 — ${pp.name}`); } }}>
              <span className="mono" style={{ color: on ? 'var(--accent)' : 'var(--dimmer)', marginTop: 1 }}>{on ? '◉' : '○'}</span>
              <div className="grow">
                <div>
                  <span className="mono" style={{ fontSize: 14, color: on ? 'var(--txt)' : 'var(--dim)', fontWeight: on ? 700 : 400 }}>{pp.name}</span>
                  {pp.id === 'sunny' && <span className="mono c-accent" style={{ fontSize: 11, marginLeft: 8 }}>(기본)</span>}
                </div>
                <div className="kr c-dim" style={{ fontSize: 13, marginTop: 3 }}>{pp.tagline}</div>
                <div className="kr c-dimmer" style={{ fontSize: 12, marginTop: 5 }}>
                  "{pfmt(pp.normalHead, { d: 3, day: '목' })}{pfmt(pp.normalRest, { streak: 5 })}"
                </div>
              </div>
            </div>
          );
        })}
      </CliBox>

      <div style={{ height: 16 }} />
      <CliBox title="manual · 사용법">
        <Foldable title="처음 왔으면 읽기 — 5분 사용법" body={kManual} first />
        <div className="row" style={{ cursor: 'pointer' }} onClick={() => useTutorial.getState().start()}>
          <span className="mono c-accent">▶</span>
          <span className="grow kr" style={{ fontSize: 14, fontWeight: 500 }}>인터랙티브 튜토리얼 다시 보기</span>
          <span className="mono c-dimmer" style={{ fontSize: 11 }}>따라하면서 배우기</span>
        </div>
      </CliBox>
      <div style={{ height: 16 }} />
      <CliBox title="about · 이 앱은 뭔가">
        <div className="kr" style={{ padding: '14px 16px', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{p.about}</div>
      </CliBox>
      <div style={{ height: 16 }} />
      <CliBox title="policy · 정책">
        <Foldable title="개인정보처리방침" body={kPrivacyPolicy} first />
        <Foldable title="이용약관" body={kTerms} />
      </CliBox>

      <div style={{ height: 16 }} />
      {/* 백업 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        <span className="chip mono" onClick={doExport}>⬇ export</span>
        <span className="chip mono" onClick={doImport}>⬆ import</span>
        <span className="chip mono" onClick={doReset}>reset</span>
      </div>
      <div style={{ textAlign: 'center', marginTop: 14 }}>
        <span className="mono c-dimmer" style={{ fontSize: 11 }}>deploy-day · 문의 jungwonil11@gmail.com</span>
      </div>
    </div>
  );
}
