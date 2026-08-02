import { useEffect, useRef, useState } from 'react';
import type { PairResult } from '../types';

interface Props {
  docA: string;
  docB: string;
  result: PairResult;
}

/* Animates a number from its previous value (0 on mount) to the target */
function useCountUp(target: number, duration = 700): number {
  const [shown, setShown] = useState(target);
  const prevRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevRef.current ?? 0;
    prevRef.current = target;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || from === target) {
      setShown(target);
      return;
    }

    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return shown;
}

function Figure({ label, value }: { label: string; value: number }) {
  const shown = useCountUp(value);
  return (
    <div className="fig">
      <span className="fig__label">{label}</span>
      <code className="fig__value num">{shown.toLocaleString()}</code>
    </div>
  );
}

export default function ScoreCard({ docA, docB, result }: Props) {
  const { rankA, rankB, pairRank, totalPairs, pairScore, scoreA, scoreB, both, onlyA, onlyB, neither } = result;

  const reach = useCountUp(pairScore);
  const rank  = useCountUp(pairRank);

  return (
    <div className="verdict">
      <div className="verdict__main">
        <code className="verdict__num num">{reach.toLocaleString()}</code>
        <p className="verdict__cap">
          destinations reachable
          <span className="verdict__sub">visa-free or visa on arrival, combined</span>
        </p>
      </div>

      <div className="verdict__rank">
        <code className="verdict__rank-val num">#{rank.toLocaleString()}</code>
        <span className="verdict__rank-cap num">of {totalPairs.toLocaleString()} pairs</span>
      </div>

      <div className="figs">
        <Figure label="Both" value={both.length} />
        <Figure label={`${docA} only`} value={onlyA.length} />
        <Figure label={`${docB} only`} value={onlyB.length} />
        <Figure label="Neither" value={neither.length} />
        <Figure label={`${docA} alone`} value={scoreA} />
        <Figure label={`${docB} alone`} value={scoreB} />
      </div>

      <p className="verdict__solo num">
        {docA} ranks #{rankA} on its own / {docB} ranks #{rankB}
      </p>
    </div>
  );
}
