import Papa from 'papaparse';
import type { AccessLevel, TravelData, PairResult } from '../types';

function normalizeRawEntry(raw: string): AccessLevel {
  const v = raw.trim().toLowerCase();
  if (v === '-1' || v === 'no admission') return -1;
  if (v === 'visa required') return 0;
  if (v === 'e-visa' || v === 'eta') return 1;
  if (v === 'visa on arrival') return 2;
  if (v === 'visa free') return 3;
  if (/^\d+$/.test(v)) return 3; // day-count entries are open access with a time limit
  return 0;
}

export async function loadTravelData(): Promise<TravelData> {
  const text = await fetch('/data/travel-index.csv').then(r => r.text());

  const { data: rows } = Papa.parse<{ Passport: string; Destination: string; Requirement: string }>(
    text,
    { header: true, skipEmptyLines: true }
  );

  const data: Record<string, Record<string, AccessLevel>> = {};

  for (const row of rows) {
    const doc = row.Passport?.trim();
    const dest = row.Destination?.trim();
    if (!doc || !dest) continue;
    if (!data[doc]) data[doc] = {};
    data[doc][dest] = normalizeRawEntry(row.Requirement ?? '');
  }

  const documents = Object.keys(data).sort();

  const destSet = new Set<string>();
  for (const doc of documents) {
    for (const dest of Object.keys(data[doc])) destSet.add(dest);
  }
  const destinations = Array.from(destSet).sort();

  // Score = destinations reachable without advance embassy approval (level >= 2)
  const individualScores: Record<string, number> = {};
  for (const doc of documents) {
    let score = 0;
    for (const dest of destinations) {
      const level = data[doc][dest];
      if (level !== undefined && level >= 2) score++;
    }
    individualScores[doc] = score;
  }

  // Rank 1 = most reachable. Ties share the same rank.
  const sorted = [...documents].sort((a, b) => individualScores[b] - individualScores[a]);
  const individualRankings: Record<string, number> = {};
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && individualScores[sorted[i]] !== individualScores[sorted[i - 1]]) {
      currentRank = i + 1;
    }
    individualRankings[sorted[i]] = currentRank;
  }

  // Precompute union scores for all document pairs (runs once on load)
  const pairRankings: TravelData['pairRankings'] = [];
  for (let i = 0; i < documents.length; i++) {
    for (let j = i + 1; j < documents.length; j++) {
      const a = documents[i];
      const b = documents[j];
      let score = 0;
      for (const dest of destinations) {
        if (dest === a || dest === b) continue;
        const la = data[a][dest];
        const lb = data[b][dest];
        if ((la !== undefined && la >= 2) || (lb !== undefined && lb >= 2)) score++;
      }
      pairRankings.push({ a, b, score });
    }
  }
  pairRankings.sort((x, y) => y.score - x.score);

  // O(1) lookup - store both key orderings
  const pairRankMap = new Map<string, number>();
  let pairRank = 1;
  for (let i = 0; i < pairRankings.length; i++) {
    if (i > 0 && pairRankings[i].score !== pairRankings[i - 1].score) pairRank = i + 1;
    const { a, b } = pairRankings[i];
    pairRankMap.set(`${a}|${b}`, pairRank);
    pairRankMap.set(`${b}|${a}`, pairRank);
  }

  return { data, documents, destinations, individualScores, individualRankings, pairRankings, pairRankMap, totalPairs: pairRankings.length };
}

export function computePair(td: TravelData, docA: string, docB: string): PairResult {
  const { data, destinations, individualScores, individualRankings, pairRankMap, totalPairs } = td;
  const rowA = data[docA] ?? {};
  const rowB = data[docB] ?? {};

  const both: string[] = [], onlyA: string[] = [], onlyB: string[] = [],
    neither: string[] = [], union: string[] = [];

  for (const dest of destinations) {
    if (dest === docA || dest === docB) continue;
    const la = rowA[dest];
    const lb = rowB[dest];
    if (la === -1 && lb === -1) continue; // NOT APPLICABLE for both - skip

    const aReachable = la !== undefined && la >= 2;
    const bReachable = lb !== undefined && lb >= 2;

    if (aReachable && bReachable) { both.push(dest); union.push(dest); }
    else if (aReachable)          { onlyA.push(dest); union.push(dest); }
    else if (bReachable)          { onlyB.push(dest); union.push(dest); }
    else                          { neither.push(dest); }
  }

  return {
    both, onlyA, onlyB, neither, union,
    pairScore: union.length,
    scoreA: individualScores[docA] ?? 0,
    scoreB: individualScores[docB] ?? 0,
    rankA: individualRankings[docA] ?? 0,
    rankB: individualRankings[docB] ?? 0,
    pairRank: pairRankMap.get(`${docA}|${docB}`) ?? totalPairs,
    totalPairs,
  };
}

export function getAccessLabel(level: AccessLevel | undefined): string {
  if (level === undefined || level === -1) return '-';
  const labels: Record<number, string> = { 3: 'Visa-free', 2: 'On arrival', 1: 'eVisa / eTA', 0: 'Visa required' };
  return labels[level] ?? '-';
}

export function getAccessClass(level: AccessLevel | undefined): string {
  if (level === undefined || level === -1) return 'entry-na';
  const classes: Record<number, string> = { 3: 'entry-open', 2: 'entry-arrival', 1: 'entry-electronic', 0: 'entry-restricted' };
  return classes[level] ?? 'entry-na';
}
