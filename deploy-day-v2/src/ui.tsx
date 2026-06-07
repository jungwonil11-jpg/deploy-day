// 공유 UI 컴포넌트 — CLI 박스, 프롬프트 입력, 점, 빈 안내.
import { useState, type ReactNode } from 'react';

export function CliBox({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="clibox">
      <div className="clibox-body">{children}</div>
      {title && <div className="clibox-title">{title}</div>}
    </div>
  );
}

export function PDot({ color }: { color: string }) {
  return <span className="pdot" style={{ background: color }} />;
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="empty kr">
      <span className="mono" style={{ marginRight: 6 }}>✻</span>
      {text.split('\n').map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}

// ❯ 프롬프트 입력행 (Enter 또는 ⏎ 클릭으로 추가)
export function PromptInput({
  placeholder,
  button,
  onAdd,
}: {
  placeholder: string;
  button: string;
  onAdd: (v: string) => void;
}) {
  const [v, setV] = useState('');
  const submit = () => {
    if (!v.trim()) return;
    onAdd(v);
    setV('');
  };
  return (
    <div className="promptrow">
      <span className="caret">❯</span>
      <input
        className="kr"
        value={v}
        placeholder={placeholder}
        maxLength={120}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
      />
      <span className="submit mono" onClick={submit}>⏎ {button}</span>
    </div>
  );
}
