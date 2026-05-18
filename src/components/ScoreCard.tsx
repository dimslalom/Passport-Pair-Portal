import type { PairResult } from '../types';

interface Props {
  docA: string;
  docB: string;
  result: PairResult;
}

interface StatProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}

function Stat({ label, value, sub, accent }: StatProps) {
  return (
    <div className={`sc-stat${accent ? ' sc-stat--accent' : ''}`}>
      <span className="sc-stat__label">{label}</span>
      <code className="sc-stat__value">{value}</code>
      {sub && <span className="sc-stat__sub">{sub}</span>}
    </div>
  );
}

export default function ScoreCard({ docA, docB, result }: Props) {
  const { rankA, rankB, pairRank, totalPairs, pairScore, scoreA, scoreB, both, onlyA, onlyB, neither } = result;

  return (
    <div className="scorecard">
      <div className="sc-row sc-row--ranks">
        <Stat label={docA} value={`#${rankA}`} sub={`${scoreA} reachable`} />
        <Stat label={docB} value={`#${rankB}`} sub={`${scoreB} reachable`} />
        <Stat
          label="Pair rank"
          value={`#${pairRank.toLocaleString()}`}
          sub={`of ${totalPairs.toLocaleString()} pairs`}
          accent
        />
      </div>

      <div className="sc-divider" />

      <div className="sc-row sc-row--breakdown">
        <Stat label="Reachable" value={pairScore} />
        <Stat label="Both" value={both.length} />
        <Stat label="A only" value={onlyA.length} />
        <Stat label="B only" value={onlyB.length} />
        <Stat label="Neither" value={neither.length} />
      </div>
    </div>
  );
}
