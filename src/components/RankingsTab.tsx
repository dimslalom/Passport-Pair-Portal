import React, { useState, useMemo } from 'react';
import type { TravelData } from '../types';
import { computePair } from '../lib/travel';
import { getISOCode } from '../lib/iso';
import ScoreCard from './ScoreCard';
import WorldMap from './WorldMap';

interface Props {
  travelData: TravelData;
  onOpenCompare: (docA: string, docB: string) => void;
}

const PAGE_SIZE = 100;

export default function RankingsTab({ travelData, onOpenCompare }: Props) {
  const { pairRankings, pairRankMap, data, totalPairs } = travelData;

  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const a = searchA.trim().toLowerCase();
    const b = searchB.trim().toLowerCase();
    if (!a && !b) return pairRankings;
    return pairRankings.filter(pair => {
      const pa = pair.a.toLowerCase();
      const pb = pair.b.toLowerCase();
      if (a && b) {
        return (pa.includes(a) && pb.includes(b)) || (pa.includes(b) && pb.includes(a));
      }
      const term = a || b;
      return pa.includes(term) || pb.includes(term);
    });
  }, [pairRankings, searchA, searchB]);

  const sorted = useMemo(
    () => sortDir === 'asc' ? filtered : [...filtered].reverse(),
    [filtered, sortDir]
  );

  const bothSearched = searchA.trim().length > 0 && searchB.trim().length > 0;
  const autoExpanded = sorted.length === 1 ? `${sorted[0].a}|${sorted[0].b}` : null;
  const activeExpanded = autoExpanded ?? expanded;

  const visible = sorted.slice(0, page * PAGE_SIZE);

  function getRank(a: string, b: string) {
    return pairRankMap.get(`${a}|${b}`) ?? totalPairs;
  }

  function toggle(key: string) {
    if (autoExpanded) return;
    setExpanded(e => e === key ? null : key);
  }

  function handleSearchA(v: string) { setSearchA(v); setPage(1); if (!autoExpanded) setExpanded(null); }
  function handleSearchB(v: string) { setSearchB(v); setPage(1); if (!autoExpanded) setExpanded(null); }

  return (
    <div className="rankings">
      <div className="rankings__toolbar">
        <div className="rankings__search">
          <div className="rankings__field">
            <label className="rankings__field-label">Passport A</label>
            <input
              className="rankings__input"
              placeholder="e.g. Germany"
              value={searchA}
              onChange={e => handleSearchA(e.target.value)}
            />
          </div>
          <div className="rankings__field">
            <label className="rankings__field-label">Passport B</label>
            <input
              className="rankings__input"
              placeholder="e.g. Japan"
              value={searchB}
              onChange={e => handleSearchB(e.target.value)}
            />
          </div>
          {(searchA || searchB) && (
            <button className="rankings__clear" onClick={() => { setSearchA(''); setSearchB(''); setExpanded(null); setPage(1); }}>
              Clear
            </button>
          )}
        </div>
        <div className="rankings__meta">
          <span className="rankings__count font-mono">
            {filtered.length.toLocaleString()} <span className="rankings__count-label">pairs</span>
          </span>
          <button className="rankings__sort" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
            Rank {sortDir === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {bothSearched && sorted.length === 0 && (
        <p className="rankings__no-results">No pair found matching both search terms.</p>
      )}

      <div className="rank-table-wrap"><table className="rank-table">
        <thead>
          <tr>
            <th className="rank-th rank-th--rank">Rank</th>
            <th className="rank-th">Passport A</th>
            <th className="rank-th">Passport B</th>
            <th className="rank-th rank-th--score">Reachable</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(pair => {
            const key = `${pair.a}|${pair.b}`;
            const rank = getRank(pair.a, pair.b);
            const isExpanded = activeExpanded === key;
            const result = isExpanded ? computePair(travelData, pair.a, pair.b) : null;

            return (
              <React.Fragment key={key}>
                <tr
                  className={`rank-row${isExpanded ? ' rank-row--open' : ''}${autoExpanded ? '' : ' rank-row--clickable'}`}
                  onClick={() => toggle(key)}
                >
                  <td className="rank-row__rank"><code className="font-mono">#{rank.toLocaleString()}</code></td>
                  <td className="rank-row__doc">
                    <code className="rank-row__iso font-mono">[{getISOCode(pair.a) ?? '??'}]</code>{pair.a}
                  </td>
                  <td className="rank-row__doc">
                    <code className="rank-row__iso font-mono">[{getISOCode(pair.b) ?? '??'}]</code>{pair.b}
                  </td>
                  <td className="rank-row__score"><code className="font-mono">{pair.score}</code></td>
                </tr>

                {isExpanded && result && (
                  <tr className="rank-detail">
                    <td colSpan={4}>
                      <div className="rank-detail__inner">
                        <div className="rank-detail__left">
                          <div className="rank-detail__score">
                            <ScoreCard docA={pair.a} docB={pair.b} result={result} />
                          </div>
                          <div className="rank-detail__footer">
                            <button
                              className="rank-detail__cta"
                              onClick={e => { e.stopPropagation(); onOpenCompare(pair.a, pair.b); }}
                            >
                              More details →
                            </button>
                          </div>
                        </div>
                        <div className="rank-detail__map">
                          <WorldMap
                            docA={pair.a}
                            docB={pair.b}
                            dataA={data[pair.a] ?? {}}
                            dataB={data[pair.b] ?? {}}
                            compact
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table></div>

      {visible.length < sorted.length && (
        <div className="rankings__more">
          <button className="rankings__load-btn" onClick={() => setPage(p => p + 1)}>
            Load more — {(sorted.length - visible.length).toLocaleString()} remaining
          </button>
        </div>
      )}
    </div>
  );
}
