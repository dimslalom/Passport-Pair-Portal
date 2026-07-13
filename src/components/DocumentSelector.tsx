import { useState, useRef, useEffect } from 'react';
import { getISOCode } from '../lib/iso';

interface Props {
  label: string;
  documents: string[];
  value: string | null;
  onChange: (doc: string) => void;
}

export default function DocumentSelector({ label, documents, value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query
    ? documents.filter(d => d.toLowerCase().includes(query.toLowerCase()))
    : documents;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (doc: string) => { onChange(doc); setOpen(false); setQuery(''); };
  const code = (doc: string) => getISOCode(doc) ?? '??';

  return (
    <div className="selector" ref={ref}>
      <span className="selector__label">{label}</span>
      <button
        className="selector__trigger"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {value
          ? <>{value} <code className="selector__code">{code(value)}</code></>
          : <span className="selector__placeholder">Select country…</span>}
      </button>

      {open && (
        <div className="selector__dropdown" role="listbox">
          <input
            className="selector__search"
            autoFocus
            placeholder="Type to filter…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <ul className="selector__list">
            {filtered.map(doc => (
              <li
                key={doc}
                role="option"
                aria-selected={doc === value}
                className={`selector__item${doc === value ? ' selector__item--active' : ''}`}
                onMouseDown={() => select(doc)}
              >
                {doc}<code className="selector__code">{code(doc)}</code>
              </li>
            ))}
            {filtered.length === 0 && <li className="selector__empty">No results</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
