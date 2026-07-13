import { useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { geoRobinson } from 'd3-geo-projection';
import type { AccessLevel, TooltipState } from '../types';
import { getAccessLabel } from '../lib/travel';

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
  { color: 'var(--ink)',    label: 'Both passports' },
  { color: 'var(--map-a)',  label: 'Passport A only' },
  { color: 'var(--map-b)',  label: 'Passport B only' },
  { color: '#e7e3d7',       label: 'Restricted' },
  { color: '#b3ac9c',       label: 'Home countries' },
] as const;

interface Props {
  docA: string; docB: string;
  dataA: Record<string, AccessLevel>; dataB: Record<string, AccessLevel>;
  compact?: boolean;
}

function countryColor(name: string, docA: string, docB: string, dataA: Record<string, AccessLevel>, dataB: Record<string, AccessLevel>): string {
  const csv = TOPO_TO_CSV[name] ?? name;
  if (csv === docA || csv === docB) return '#b3ac9c';
  const la = dataA[csv]; const lb = dataB[csv];
  const aOk = la !== undefined && la >= 2;
  const bOk = lb !== undefined && lb >= 2;
  if (aOk && bOk) return 'var(--ink)';
  if (aOk) return 'var(--map-a)';
  if (bOk) return 'var(--map-b)';
  return '#e7e3d7';
}

// Full map: geoRobinson defaults to [480,250] for 960×500; corrected for our 800×460 viewBox
const PROJECTION = geoRobinson().scale(145).translate([400, 230]);
// Compact map: scaled for 800×300 viewBox - scale proportional to height, center halved
const COMPACT_PROJECTION = geoRobinson().scale(95).translate([400, 150]);
const BLANK_STYLE = { default: { outline: 'none' }, hover: { outline: 'none', opacity: 0.8 }, pressed: { outline: 'none' } };
const MIN_ZOOM = 1; const MAX_ZOOM = 8;
const GEO_URL = '/data/world-110m.json';

export default function WorldMap({ docA, docB, dataA, dataB, compact = false }: Props) {
  const [zoom, setZoom] = useState(1);
  const [tip, setTip] = useState<TooltipState>({ visible: false, x: 0, y: 0, country: '', entryA: undefined, entryB: undefined });

  const geos = (
    <Geographies geography={GEO_URL}>
      {({ geographies }) => geographies.map(geo => {
        const name: string = geo.properties.name;
        return (
          <Geography
            key={geo.rsmKey} geography={geo}
            fill={countryColor(name, docA, docB, dataA, dataB)}
            stroke="var(--color-bg)" strokeWidth={0.4} style={BLANK_STYLE}
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
  );

  return (
    <div className="worldmap">
      <ComposableMap
        projection={compact ? COMPACT_PROJECTION : PROJECTION} width={800} height={compact ? 300 : 460}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {compact
          ? geos
          : <ZoomableGroup zoom={zoom} minZoom={MIN_ZOOM} maxZoom={MAX_ZOOM} onMoveEnd={({ zoom: z }) => setZoom(z)}>{geos}</ZoomableGroup>
        }
      </ComposableMap>

      {!compact && (
        <div className="map-controls">
          <button className="map-btn" onClick={() => setZoom(z => Math.min(z * 2, MAX_ZOOM))} aria-label="Zoom in">+</button>
          <button className="map-btn" onClick={() => setZoom(z => Math.max(z / 2, MIN_ZOOM))} aria-label="Zoom out">−</button>
          <button className="map-btn map-btn--reset" onClick={() => setZoom(1)} aria-label="Reset zoom">Reset</button>
        </div>
      )}

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
            <span className="map-legend__dot" style={{ background: color }} />{label}
          </span>
        ))}
      </div>
    </div>
  );
}
