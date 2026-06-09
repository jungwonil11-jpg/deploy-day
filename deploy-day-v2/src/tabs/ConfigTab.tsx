// /config — 테마·언어·페르소나·사용법·소개·정책·백업.
import { useState } from 'react';
import { save, open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { todayStr, dayTok } from '../types';
import { useApp } from '../store';
import { personaList, personaOf, pfmt } from '../persona';
import { broadcastMemoTheme } from '../memoWindows';
import { useUI, fmt } from '../i18n';
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
  const setLang = useApp((st) => st.setLang);
  const setPersona = useApp((st) => st.setPersona);
  const exportJson = useApp((st) => st.exportJson);
  const importJson = useApp((st) => st.importJson);
  const reset = useApp((st) => st.reset);

  const p = personaOf(s);
  const L = useUI();
  // export: 저장 위치를 고른 뒤 JSON 파일로 기록 (다른 PC로 파일째 옮겨감)
  const doExport = async () => {
    const path = await save({
      title: L.saveTitle,
      defaultPath: `deployday-backup-${todayStr()}.json`,
      filters: [{ name: L.backupFilter, extensions: ['json'] }],
    });
    if (!path) return; // 취소
    try {
      await invoke('save_text_file', { path, contents: exportJson() });
      uiToast(p.ui.exportToast);
    } catch {
      uiToast(p.ui.exportFail);
    }
  };
  // import: 백업 파일을 골라 내용으로 현재 데이터를 덮어씀
  const doImport = async () => {
    const picked = await open({
      title: L.openTitle,
      multiple: false,
      directory: false,
      filters: [{ name: L.backupFilter, extensions: ['json'] }],
    });
    if (typeof picked !== 'string') return; // 취소(null) 또는 다중선택 방어
    const ok = await uiConfirm(p.ui.importAsk, L.restoreLabel);
    if (!ok) return;
    try {
      const raw = await invoke<string>('read_text_file', { path: picked });
      importJson(raw);
      uiToast(p.ui.importOk);
    } catch {
      uiToast(p.ui.importFail);
    }
  };
  const doReset = async () => {
    if (await uiConfirm(p.ui.resetAsk, L.resetLabel)) { reset(); uiToast(p.ui.resetToast); }
  };

  return (
    <div>
      {/* 테마 */}
      <CliBox title={L.themeTitle}>
        <div style={{ display: 'flex' }}>
          {([['dark', L.darkLabel, true], ['light', L.lightLabel, false]] as const).map(([k, label, dark], i) => {
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

      {/* 언어 */}
      <CliBox title={L.langTitle}>
        <div style={{ display: 'flex' }}>
          {([['ko', '한국어'], ['en', 'English']] as const).map(([code, label], i) => {
            const on = s.lang === code;
            return (
              <div
                key={code}
                onClick={() => { if (!on) setLang(code); }}
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
      <CliBox title={L.personaTitle}>
        {personaList(s.lang).map((pp, i) => {
          const on = personaOf(s).id === pp.id;
          return (
            <div key={pp.id} className="row" style={{ borderTop: i === 0 ? 'none' : '1px solid var(--line)', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => { if (!on) { setPersona(pp.id); uiToast(fmt(L.personaToast, { name: pp.name })); } }}>
              <span className="mono" style={{ color: on ? 'var(--accent)' : 'var(--dimmer)', marginTop: 1 }}>{on ? '◉' : '○'}</span>
              <div className="grow">
                <div>
                  <span className="mono" style={{ fontSize: 14, color: on ? 'var(--txt)' : 'var(--dim)', fontWeight: on ? 700 : 400 }}>{pp.name}</span>
                  {pp.id === 'sunny' && <span className="mono c-accent" style={{ fontSize: 11, marginLeft: 8 }}>{L.defaultBadge}</span>}
                </div>
                <div className="kr c-dim" style={{ fontSize: 13, marginTop: 3 }}>{pp.tagline}</div>
                <div className="kr c-dimmer" style={{ fontSize: 12, marginTop: 5 }}>
                  "{pfmt(pp.normalHead, { d: 3, day: dayTok(s.lang, 4) })}{pfmt(pp.normalRest, { streak: 5 })}"
                </div>
              </div>
            </div>
          );
        })}
      </CliBox>

      <div style={{ height: 16 }} />
      <CliBox title={L.manualTitle}>
        <Foldable title={L.manualFold} body={kManual[s.lang]} first />
        <div className="row" style={{ cursor: 'pointer' }} onClick={() => useTutorial.getState().start()}>
          <span className="mono c-accent">▶</span>
          <span className="grow kr" style={{ fontSize: 14, fontWeight: 500 }}>{L.tutReplay}</span>
          <span className="mono c-dimmer" style={{ fontSize: 11 }}>{L.tutReplayHint}</span>
        </div>
      </CliBox>
      <div style={{ height: 16 }} />
      <CliBox title={L.aboutTitle}>
        <div className="kr" style={{ padding: '14px 16px', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{p.about}</div>
      </CliBox>
      <div style={{ height: 16 }} />
      <CliBox title={L.policyTitle}>
        <Foldable title={L.privacyTitle} body={kPrivacyPolicy[s.lang]} first />
        <Foldable title={L.termsTitle} body={kTerms[s.lang]} />
      </CliBox>

      <div style={{ height: 16 }} />
      {/* 백업 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        <span className="chip mono" onClick={doExport}>⬇ export</span>
        <span className="chip mono" onClick={doImport}>⬆ import</span>
        <span className="chip mono" onClick={doReset}>reset</span>
      </div>
      <div style={{ textAlign: 'center', marginTop: 14 }}>
        <span className="mono c-dimmer" style={{ fontSize: 11 }}>{L.contact}</span>
      </div>
    </div>
  );
}
