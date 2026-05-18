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

  if (loading) return <div className="app-state">Loading travel data…</div>;
  if (error)   return <div className="app-state app-state--error">{error}</div>;
  if (!travelData) return null;

  const dataA = docA ? (travelData.data[docA] ?? {}) : {};
  const dataB = docB ? (travelData.data[docB] ?? {}) : {};
  const bothSelected = Boolean(docA && docB);

  return (
    <div className="app">
      <header className="site-header">
        <div className="site-header__inner">
          <h1 className="site-header__title">PASSPORT PAIR PORTAL</h1>
          <p className="site-header__desc">Find the strongest combination of two travel documents.</p>
        </div>
        <nav className="site-nav">
          <button
            className={`site-nav__tab${tab === 'compare' ? ' site-nav__tab--active' : ''}`}
            onClick={() => setTab('compare')}
          >Compare</button>
          <button
            className={`site-nav__tab${tab === 'rankings' ? ' site-nav__tab--active' : ''}`}
            onClick={() => setTab('rankings')}
          >Rankings</button>
        </nav>
      </header>

      {tab === 'compare' && (
        <>
          <section className="selector-section">
            <div className="selector-col">
              <DocumentSelector label="Document A" documents={travelData.documents} value={docA} onChange={setDocA} />
              <DocumentSelector label="Document B" documents={travelData.documents} value={docB} onChange={setDocB} />
            </div>
            <div className="scorecard-col">
              {result && docA && docB
                ? <ScoreCard docA={docA} docB={docB} result={result} />
                : <p className="scorecard-empty">Select two travel documents above to compare their combined reach.</p>}
            </div>
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
  );
}
