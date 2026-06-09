// /changelog — 릴리즈 히스토리. 배포 시점 프로젝트 스냅샷으로 박제(프로젝트 삭제와 무관하게 유지).
import { useState } from 'react';
import { useApp } from '../store';
import { personaOf, pfmt } from '../persona';
import { projColor, projName, verStr, dayTok, type Release } from '../types';
import { useUI } from '../i18n';
import { CliBox, PDot, Empty } from '../ui';

function ReleaseTile({ r, first, open0 }: { r: Release; first: boolean; open0: boolean }) {
  const s = useApp((st) => st.s);
  const L = useUI();
  const [open, setOpen] = useState(open0);
  const shipped = r.notes.filter((n) => n.done).length;
  const missed = r.notes.length - shipped;
  const ver = verStr(r.major, r.minor);

  // 그룹 순서: 배포 시점 스냅샷 프로젝트 먼저, 그다음 노트에만 있는 것(구버전 릴리즈) + 미분류(null)
  const pids: (string | null)[] = [];
  for (const p of r.projects) if (r.notes.some((n) => n.project === p.id) && !pids.includes(p.id)) pids.push(p.id);
  for (const n of r.notes) if (!pids.includes(n.project)) pids.push(n.project);

  // 표시 이름·색: 스냅샷 → (구버전이면) 현재 프로젝트 → 둘 다 없으면 "삭제된 프로젝트". null=미분류.
  const metaOf = (pid: string | null): { name: string; color: string } => {
    if (pid === null) return { name: projName(s, null), color: projColor(s, null) };
    const snap = r.projects.find((p) => p.id === pid);
    if (snap) return { name: snap.name, color: snap.color };
    const cur = s.projects.find((p) => p.id === pid);
    if (cur) return { name: cur.name, color: cur.color };
    return { name: L.deletedProject, color: '#5C5C5C' };
  };

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
          {pids.map((pid) => {
            const ns = r.notes.filter((n) => n.project === pid);
            if (ns.length === 0) return null;
            const meta = metaOf(pid);
            return (
              <div key={`${pid}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 0 4px' }}>
                  <PDot color={meta.color} />
                  <span className="mono" style={{ fontSize: 11, color: 'var(--dim)' }}>{meta.name}</span>
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
