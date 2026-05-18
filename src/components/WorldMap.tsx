import { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { geoRobinson } from 'd3-geo-projection';
import type { AccessLevel, TooltipState } from '../types';
import { getAccessLabel } from '../lib/travel';

// Bridges topojson abbreviated/modernized names to CSV country names
const TOPO_TO_CSV: Record<string, string> = {
  'United States of America': 'United States',
  'Bosnia and Herz.':         'Bosnia and Herzegovina',
  'Central African Rep.':     'Central African Republic',
  'Dominican Rep.':           'Dominican Republic',
  'Czechia':                  'Czech Republic',
  'Macedonia':                'North Macedonia',
  'S. Sudan':                 'South Sudan',
  'Dem. Rep. Congo':          'DR Congo',
  'Eq. Guinea':               'Equatorial Guinea',
  'Solomon Is.':              'Solomon Islands',
  'eSwatini':                 'Swaziland',
  "Côte d'Ivoire":            'Ivory Coast',
};

const LEGEND = [
  { color: 'var(--color-accent)', label: 'Both documents' },
  { color: '#4a90c8',             label: 'Document A only' },
  { color: '#c84a4a',             label: 'Document B only' },
  { color: '#2a2a2a',             label: 'Restricted' },
  { color: '#555555',             label: 'Home countries' },
] as const;

interface Props {
  docA: string;
  docB: string;
  dataA: Record<string, AccessLevel>;
  dataB: Record<string, AccessLevel>;
}

function countryColor(name: string, docA: string, docB: string, dataA: Record<string, AccessLevel>, dataB: Record<string, AccessLevel>): string {
  const csv = TOPO_TO_CSV[name] ?? name;
  if (csv === docA || csv === docB) return '#555555';
  const la = dataA[csv]; const lb = dataB[csv];
  const aOk = la !== undefined && la >= 2;
  const bOk = lb !== undefined && lb >= 2;
  if (aOk && bOk) return 'var(--color-accent)';
  if (aOk) return '#4a90c8';
  if (bOk) return '#c84a4a';
  return '#2a2a2a';
}

const PROJECTION = geoRobinson();
const BLANK_STYLE = { default: { outline: 'none' }, hover: { outline: 'none', opacity: 0.8 }, pressed: { outline: 'none' } };

export default function WorldMap({ docA, docB, dataA, dataB }: Props) {
  const [tip, setTip] = useState<TooltipState>({ visible: false, x: 0, y: 0, country: '', entryA: undefined, entryB: undefined });

  return (
    <div className="worldmap">
      <ComposableMap projection={PROJECTION} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <Geographies geography="/data/world-110m.json">
          {({ geographies }) => geographies.map(geo => {
            const name: string = geo.properties.name;
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={countryColor(name, docA, docB, dataA, dataB)}
                stroke="var(--color-bg)"
                strokeWidth={0.4}
                style={BLANK_STYLE}
                onMouseEnter={e => {
                  const csv = TOPO_TO_CSV[name] ?? name;
                  setTip({ visible: true, x: e.clientX, y: e.clientY, country: csv, entryA: dataA[csv], entryB: dataB[csv] });
                }}
                onMouseMove={e => setTip(t => ({ ...t, x: e.clientX, y: e.clientY }))}
                onMouseLeave={() => setTip(t => ({ ...t, visible: false }))}
              />
            );
          })}
        </Geographies>
      </ComposableMap>

      {tip.visible && (
        <div className="map-tip" style={{ left: tip.x + 14, top: tip.y - 8 }}>
          <div className="map-tip__name">{tip.country}</div>
          <div className="map-tip__row"><span>A</span><code>{getAccessLabel(tip.entryA)}</code></div>
          <div className="map-tip__row"><span>B</span><code>{getAccessLabel(tip.entryB)}</code></div>
        </div>
      )}

      <div className="map-legend">
        {LEGEND.map(({ color, label }) => (
          <span key={label} className="map-legend__item">
            <span className="map-legend__dot" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
