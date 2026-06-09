// /changelog — 릴리즈 히스토리.
import { useState } from 'react';
import { useApp } from '../store';
import { personaOf, pfmt } from '../persona';
import {
  projColor,
  projName,
  projOrder,
  verStr,
  dayTok,
  type Release,
} from '../types';
import { useUI } from '../i18n';
import { CliBox, PDot, Empty } from '../ui';

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
            return (
              <div key={`${pid}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 0 4px' }}>
                  <PDot color={projColor(s, pid)} />
                  <span className="mono" style={{ fontSize: 11, color: 'var(--dim)' }}>{projName(s, pid)}</span>
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
  const p = personaOf(s);
  const L = useUI();
  const releases = [...s.releases].reverse();

  return (
    <CliBox title={L.changelogTitle}>
      {releases.length === 0 ? (
        <Empty text={pfmt(p.emptyChangelog, { day: dayTok(s.lang, s.shipDay), ver: verStr(s.major, s.minor + 1) })} />
      ) : (
        releases.map((r, i) => (
          <ReleaseTile key={`${r.major}.${r.minor}-${r.date}`} r={r} first={i === 0} open0={i === 0} />
        ))
      )}
    </CliBox>
  );
}
