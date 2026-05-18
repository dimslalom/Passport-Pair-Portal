import { useState } from 'react';
import type { AccessLevel, SortField, SortDirection } from '../types';
import { getAccessLabel, getAccessClass } from '../lib/travel';

interface Props {
  destinations: string[];
  dataA: Record<string, AccessLevel>;
  dataB: Record<string, AccessLevel>;
  docA: string;
  docB: string;
}

const LEVEL_ORDER: Record<number, number> = { 3: 0, 2: 1, 1: 2, 0: 3, [-1]: 4 };

export default function DestinationTable({ destinations, dataA, dataB, docA, docB }: Props) {
  const [field, setField] = useState<SortField>('country');
  const [dir, setDir] = useState<SortDirection>('asc');

  function handleSort(f: SortField) {
    if (f === field) setDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setField(f); setDir('asc'); }
  }

  const rows = destinations
    .filter(d => d !== docA && d !== docB)
    .sort((a, b) => {
      let cmp = 0;
      if (field === 'country') cmp = a.localeCompare(b);
      else if (field === 'entryA') cmp = (LEVEL_ORDER[dataA[a] ?? -1] ?? 4) - (LEVEL_ORDER[dataA[b] ?? -1] ?? 4);
      else                         cmp = (LEVEL_ORDER[dataB[a] ?? -1] ?? 4) - (LEVEL_ORDER[dataB[b] ?? -1] ?? 4);
      return dir === 'asc' ? cmp : -cmp;
    });

  function Th({ f, children }: { f: SortField; children: string }) {
    const active = field === f;
    return (
      <th className={active ? 'th--active' : ''}>
        <button className="th-sort" onClick={() => handleSort(f)}>
          {children}<span className="th-sort__arrow">{active ? (dir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}</span>
        </button>
      </th>
    );
  }

  return (
    <div className="dest-table-wrap">
      <table className="dest-table">
        <thead>
          <tr>
            <Th f="country">Country</Th>
            <Th f="entryA">Entry via A</Th>
            <Th f="entryB">Entry via B</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((dest, i) => (
            <tr key={dest} className={i % 2 === 1 ? 'dest-table__row--alt' : ''}>
              <td className="dest-table__country">{dest}</td>
              <td><code className={`entry-badge ${getAccessClass(dataA[dest])}`}>{getAccessLabel(dataA[dest])}</code></td>
              <td><code className={`entry-badge ${getAccessClass(dataB[dest])}`}>{getAccessLabel(dataB[dest])}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
