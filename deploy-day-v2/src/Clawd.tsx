// 이스터에그 — 픽셀 Clawd (Claude Code 마스코트) 오마주.
// 매 실행·클릭마다 "오류처럼" 글리치된 픽셀이 뜨고, 계속 누르다 보면
// 가끔 진짜 Clawd로 맞춰짐 (확률 ~12%). 맞추면 축하 토스트.
import { useState } from 'react';
import { uiToast } from './dialogs';

// 진짜 Clawd (Claude Code 시작 배너의 그 픽셀 생물)
const REAL = [' ▐▛███▜▌', '▝▜█████▛▘', '  ▘▘ ▝▝'];
const POOL = '░▒▓█▚▞▙▟▛▜▝▘▖▗▌▐';

// 진짜 아트를 글자단위로 깨뜨린 글리치 프레임
function glitch(): string {
  return REAL.map((line) =>
    [...line].map((c) => (c === ' ' ? ' ' : POOL[Math.floor(Math.random() * POOL.length)])).join(''),
  ).join('\n');
}

const REAL_STR = REAL.join('\n');
const HIT_RATE = 0.12; // 클릭당 진짜가 나올 확률

export function ClawdLogo({ foundMsg }: { foundMsg: string }) {
  // 첫 표시는 글리치 (매 실행 다름)
  const [art, setArt] = useState<string>(() => glitch());
  const [found, setFound] = useState(false);

  const poke = () => {
    const real = Math.random() < HIT_RATE;
    if (real) {
      setArt(REAL_STR);
      if (!found) {
        setFound(true);
        uiToast(foundMsg);
      }
    } else {
      setArt(glitch());
      setFound(false);
    }
  };

  return (
    <pre
      onClick={poke}
      title="눌러보셈 ㅋㅋ"
      style={{
        margin: '14px 0',
        lineHeight: 1.05,
        cursor: 'pointer',
        userSelect: 'none',
        color: found ? 'var(--accent)' : 'var(--accent)',
        textShadow: found ? '0 0 8px var(--accent)' : 'none',
        transition: 'text-shadow .15s',
        fontFamily: "'JetBrains Mono','Consolas',monospace",
      }}
      className="c-accent"
    >
      {art}
    </pre>
  );
}
