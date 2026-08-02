import { useState, useEffect, useMemo } from 'react';
import type { TravelData, PairResult } from './types';
import { loadTravelData, computePair } from './lib/travel';
import DocumentSelector from './components/DocumentSelector';
import ScoreCard from './components/ScoreCard';
import WorldMap from './components/WorldMap';
import DestinationTable from './components/DestinationTable';
import RankingsTab from './components/RankingsTab';
import './App.css';

type Tab = 'compare' | 'rankings';

export default function App() {
  const [travelData, setTravelData] = useState<TravelData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [tab, setTab]               = useState<Tab>('compare');
  const [docA, setDocA]             = useState<string | null>(null);
  const [docB, setDocB]             = useState<string | null>(null);

  useEffect(() => {
    loadTravelData()
      .then(setTravelData)
      .catch(() => setError('Failed to load travel index.'))
      .finally(() => setLoading(false));
  }, []);

  const result: PairResult | null = useMemo(
    () => travelData && docA && docB ? computePair(travelData, docA, docB) : null,
    [travelData, docA, docB]
  );

  function openCompare(a: string, b: string) {
    setDocA(a);
    setDocB(b);
    setTab('compare');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function swapDocs() {
    setDocA(docB);
    setDocB(docA);
  }

  if (loading) return <div className="app-state">loading travel data</div>;
  if (error)   return <div className="app-state app-state--error">{error}</div>;
  if (!travelData) return null;

  const dataA = docA ? (travelData.data[docA] ?? {}) : {};
  const dataB = docB ? (travelData.data[docB] ?? {}) : {};
  const bothSelected = Boolean(docA && docB);

  return (
    <div className="app">
      <header className="bar">
        <span className="bar__brand">
          Passport Pair Portal
          <span className="bar__dot" aria-hidden="true">*</span>
        </span>

        <nav className="bar__nav">
          <button
            className={`navtab${tab === 'compare' ? ' navtab--on' : ''}`}
            onClick={() => setTab('compare')}
          >Compare</button>
          <button
            className={`navtab${tab === 'rankings' ? ' navtab--on' : ''}`}
            onClick={() => setTab('rankings')}
          >Rankings</button>
        </nav>

        <span className="bar__credit">
          <a href="https://dimas.works" className="u-link" target="_blank" rel="noopener noreferrer">dimas.works</a>
          <a href="https://instagram.com/dimmiegoreng" className="u-link" target="_blank" rel="noopener noreferrer">@dimmiegoreng</a>
        </span>
      </header>

      <div className="panel" key={tab}>
        {tab === 'compare' && (
          <>
            <section className="stage">
              <div className="picks">
                <DocumentSelector label="A" documents={travelData.documents} value={docA} onChange={setDocA} />
                <button
                  className="swap"
                  onClick={swapDocs}
                  disabled={!docA && !docB}
                  aria-label="Swap passports A and B"
                ><span className="swap__icon" aria-hidden="true">&#8646;</span></button>
                <DocumentSelector label="B" documents={travelData.documents} value={docB} onChange={setDocB} />
              </div>

              {result && docA && docB
                ? <ScoreCard docA={docA} docB={docB} result={result} />
                : (
                  <p className="stage__hint">
                    Pick two passports to see how far they reach together
                    <span className="stage__caret" aria-hidden="true" />
                  </p>
                )}
            </section>

            {bothSelected && (
              <section className="map-section">
                <WorldMap docA={docA!} docB={docB!} dataA={dataA} dataB={dataB} />
              </section>
            )}

            {bothSelected && result && (
              <section className="table-section">
                <DestinationTable
                  destinations={travelData.destinations}
                  dataA={dataA}
                  dataB={dataB}
                  docA={docA!}
                  docB={docB!}
                />
              </section>
            )}
          </>
        )}

        {tab === 'rankings' && (
          <RankingsTab travelData={travelData} onOpenCompare={openCompare} />
        )}
      </div>

      <footer className="foot">
        <span>Made by <a href="https://instagram.com/dimmiegoreng" className="u-link" target="_blank" rel="noopener noreferrer">@dimmiegoreng</a></span>
        <span className="foot__links">
          <a href="https://dimas.works" className="u-link" target="_blank" rel="noopener noreferrer">dimas.works</a>
          <a href="https://twitter.com/dimmiegoreng" className="u-link" target="_blank" rel="noopener noreferrer">Twitter / X</a>
        </span>
      </footer>
    </div>
  );
}
