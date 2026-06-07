// /changelog — 릴리즈 히스토리 + 명예의 전당.
import { useState } from 'react';
import { useApp } from '../store';
import { personaOf, pfmt } from '../persona';
import {
  projColor,
  projName,
  projOrder,
  verStr,
  kDayKr,
  type Release,
} from '../types';
import { CliBox, PDot, Empty } from '../ui';
import { uiConfirm, uiToast } from '../dialogs';

function ReleaseTile({ r, first, open0 }: { r: Release; first: boolean; open0: boolean }) {
  const s = useApp((st) => st.s);
  const [open, setOpen] = useState(open0);
  const shipped = r.notes.filter((n) => n.done).length;
  const missed = r.notes.length - shipped;
  const ver = verStr(r.major, r.minor);

  return (
    <div style={{ borderTop: first ? 'none' : '1px solid var(--line)' }}>
      <div
        className="row"
        style={{ borderTop: 'none', alignItems: 'flex-start', cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
      >
        <span className="mono" style={{ color: missed === 0 ? 'var(--ship)' : 'var(--warn)' }}>⏺</span>
        <div className="grow">
          <span className="mono c-accent" style={{ fontSize: 16, fontWeight: 800 }}>{ver}</span>
          {r.title && <span className="kr" style={{ fontSize: 14, marginLeft: 9 }}>{r.title}</span>}
          <div className="mono c-dim" style={{ fontSize: 11, marginTop: 3 }}>{r.date}</div>
        </div>
        <span className="mono c-dimmer" style={{ fontSize: 11 }}>
          <span className="c-ship" style={{ fontWeight: 700 }}>{shipped}</span> shipped
          {missed > 0 && ` · ${missed} rolled`}
        </span>
      </div>
      {open && (
        <div style={{ padding: '0 16px 14px' }}>
          {projOrder(s).map((pid) => {
            const ns = r.notes.filter((n) => n.project === pid);
            if (ns.length === 0) return null;
            const isGrad = pid !== null && r.graduated.includes(pid);
            return (
              <div key={`${pid}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 0 4px' }}>
                  {isGrad && <span>🎉</span>}
                  <PDot color={projColor(s, pid)} />
                  <span className="mono" style={{ fontSize: 11, color: isGrad ? 'var(--ship)' : 'var(--dim)', fontWeight: isGrad ? 700 : 400 }}>
                    {projName(s, pid)}
                  </span>
                  {isGrad && (
                    <span className="mono c-ship" style={{ fontSize: 9, border: '1px solid var(--ship)', borderRadius: 4, padding: '1px 6px' }}>SHIPPED</span>
                  )}
                </div>
                {ns.map((n, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9, padding: '4px 0 4px 4px', alignItems: 'flex-start' }}>
                    <span className="mono" style={{ color: n.done ? 'var(--ship)' : 'var(--rollback)' }}>{n.done ? '+' : '−'}</span>
                    <span className="kr" style={{ fontSize: 14, color: n.done ? 'var(--txt)' : 'var(--dim)' }}>{n.text}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ChangelogTab() {
  const s = useApp((st) => st.s);
  const reviveProject = useApp((st) => st.reviveProject);
  const p = personaOf(s);
  const grads = s.projects.filter((pp) => pp.done);
  const releases = [...s.releases].reverse();

  return (
    <div>
      {grads.length > 0 && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 6, padding: '14px 16px', marginBottom: 14 }}>
          <div className="mono c-ship" style={{ fontSize: 11 }}>🎓 SHIPPED PROJECTS · 명예의 전당</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            {grads.map((pp) => (
              <div
                key={pp.id}
                style={{ minWidth: 150, border: '1px solid var(--border)', borderRadius: 5, padding: '12px 13px', cursor: 'pointer' }}
                onClick={() => { uiConfirm(pfmt(p.ui.reviveAsk, { name: pp.name })).then((ok) => { if (ok) { reviveProject(pp.id); uiToast(p.ui.reviveToast); } }); }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <PDot color={pp.color} />
                  <span className="kr" style={{ fontSize: 14, fontWeight: 500 }}>{pp.name}</span>
                </div>
                <div className="mono c-ship" style={{ fontSize: 11, marginTop: 9 }}>↻ 다시 진행</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <CliBox title="changelog · 내 인생 릴리즈 히스토리">
        {releases.length === 0 ? (
          <Empty text={pfmt(p.emptyChangelog, { day: kDayKr[s.shipDay], ver: verStr(s.major, s.minor + 1) })} />
        ) : (
          releases.map((r, i) => (
            <ReleaseTile key={`${r.major}.${r.minor}-${r.date}`} r={r} first={i === 0} open0={i === 0} />
          ))
        )}
      </CliBox>
    </div>
  );
}
