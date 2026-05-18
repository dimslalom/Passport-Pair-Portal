import Papa from 'papaparse';

export type AccessLevel = 3 | 2 | 1 | 0 | -1;

export interface PassportData {
  data: Record<string, Record<string, AccessLevel>>;
  passports: string[];
  countries: string[];
  pairRankings: PairRanking[];
  individualRankings: Record<string, number>;
}

export interface PairRanking {
  a: string;
  b: string;
  score: number;
}

export interface PairResult {
  both: string[];
  onlyA: string[];
  onlyB: string[];
  neither: string[];
  union: string[];
  pairScore: number;
  rankA: number;
  rankB: number;
  pairRank: number;
  totalPairs: number;
  scoreA: number;
  scoreB: number;
}

function normalizeValue(raw: string): AccessLevel {
  const v = raw.trim().toLowerCase();
  if (v === '-1' || v === 'no admission') return -1;
  if (v === 'visa required') return 0;
  if (v === 'e-visa' || v === 'eta') return 1;
  if (v === 'visa on arrival') return 2;
  if (v === 'visa free') return 3;
  // numeric day counts are all visa-free access
  if (/^\d+$/.test(v)) return 3;
  return 0;
}

export async function loadPassportData(): Promise<PassportData> {
  const response = await fetch('/data/passport-index.csv');
  const text = await response.text();

  const parsed = Papa.parse<{ Passport: string; Destination: string; Requirement: string }>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const data: Record<string, Record<string, AccessLevel>> = {};

  for (const row of parsed.data) {
    const passport = row.Passport?.trim();
    const destination = row.Destination?.trim();
    const raw = row.Requirement?.trim() ?? '';
    if (!passport || !destination) continue;
    if (!data[passport]) data[passport] = {};
    data[passport][destination] = normalizeValue(raw);
  }

  const passports = Object.keys(data).sort();
  const countriesSet = new Set<string>();
  for (const passport of passports) {
    for (const dest of Object.keys(data[passport])) {
      countriesSet.add(dest);
    }
  }
  const countries = Array.from(countriesSet).sort();

  // Compute individual scores (count of destinations with value >= 2)
  const individualScores: Record<string, number> = {};
  for (const passport of passports) {
    let score = 0;
    for (const dest of countries) {
      const v = data[passport][dest];
      if (v !== undefined && v >= 2) score++;
    }
    individualScores[passport] = score;
  }

  // Rank passports by individual score (rank 1 = best)
  const sortedByScore = [...passports].sort(
    (a, b) => (individualScores[b] ?? 0) - (individualScores[a] ?? 0)
  );
  const individualRankings: Record<string, number> = {};
  let rank = 1;
  for (let i = 0; i < sortedByScore.length; i++) {
    if (i > 0 && individualScores[sortedByScore[i]] !== individualScores[sortedByScore[i - 1]]) {
      rank = i + 1;
    }
    individualRankings[sortedByScore[i]] = rank;
  }

  // Precompute all pair union scores
  const pairRankings: PairRanking[] = [];
  for (let i = 0; i < passports.length; i++) {
    for (let j = i + 1; j < passports.length; j++) {
      const a = passports[i];
      const b = passports[j];
      let unionCount = 0;
      for (const dest of countries) {
        if (dest === a || dest === b) continue;
        const va = data[a][dest];
        const vb = data[b][dest];
        if ((va !== undefined && va >= 2) || (vb !== undefined && vb >= 2)) {
          unionCount++;
        }
      }
      pairRankings.push({ a, b, score: unionCount });
    }
  }

  pairRankings.sort((x, y) => y.score - x.score);

  return { data, passports, countries, pairRankings, individualRankings };
}

export function computePair(
  passportData: PassportData,
  passportA: string,
  passportB: string
): PairResult {
  const { data, countries, pairRankings, individualRankings } = passportData;

  const rowA = data[passportA] ?? {};
  const rowB = data[passportB] ?? {};

  const both: string[] = [];
  const onlyA: string[] = [];
  const onlyB: string[] = [];
  const neither: string[] = [];
  const union: string[] = [];

  for (const dest of countries) {
    if (dest === passportA || dest === passportB) continue;
    const va = rowA[dest];
    const vb = rowB[dest];
    const aIn = va !== undefined && va >= 2;
    const bIn = vb !== undefined && vb >= 2;

    // skip -1 (no admission) entries that are -1 for both
    if (va === -1 && vb === -1) continue;

    if (aIn && bIn) {
      both.push(dest);
      union.push(dest);
    } else if (aIn && !bIn) {
      onlyA.push(dest);
      union.push(dest);
    } else if (!aIn && bIn) {
      onlyB.push(dest);
      union.push(dest);
    } else {
      neither.push(dest);
    }
  }

  const pairScore = union.length;

  // find pair rank
  let pairRank = 1;
  let found = false;
  for (let i = 0; i < pairRankings.length; i++) {
    const r = pairRankings[i];
    if ((r.a === passportA && r.b === passportB) || (r.a === passportB && r.b === passportA)) {
      pairRank = i + 1;
      found = true;
      break;
    }
    if (!found && r.score < pairScore && i > 0) {
      pairRank = i;
      found = true;
      break;
    }
  }
  if (!found) pairRank = pairRankings.length;

  const scoreA = Object.values(rowA).filter(v => v >= 2).length;
  const scoreB = Object.values(rowB).filter(v => v >= 2).length;

  return {
    both,
    onlyA,
    onlyB,
    neither,
    union,
    pairScore,
    rankA: individualRankings[passportA] ?? 0,
    rankB: individualRankings[passportB] ?? 0,
    pairRank,
    totalPairs: pairRankings.length,
    scoreA,
    scoreB,
  };
}

export function getAccessLabel(value: AccessLevel | undefined): string {
  if (value === undefined) return 'UNKNOWN';
  if (value === 3) return 'FREE';
  if (value === 2) return 'ON ARRIVAL';
  if (value === 1) return 'E-VISA';
  if (value === 0) return 'REQUIRED';
  return '—';
}
