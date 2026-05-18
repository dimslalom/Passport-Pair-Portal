export type AccessLevel = 3 | 2 | 1 | 0 | -1;

export type SortDirection = 'asc' | 'desc';

export type SortField = 'country' | 'entryA' | 'entryB';

export interface PairEntry {
  a: string;
  b: string;
  score: number;
}

export interface TravelData {
  data: Record<string, Record<string, AccessLevel>>;
  documents: string[];
  destinations: string[];
  individualScores: Record<string, number>;
  individualRankings: Record<string, number>;
  pairRankings: PairEntry[];
  pairRankMap: Map<string, number>;
  totalPairs: number;
}

export interface PairResult {
  both: string[];
  onlyA: string[];
  onlyB: string[];
  neither: string[];
  union: string[];
  pairScore: number;
  scoreA: number;
  scoreB: number;
  rankA: number;
  rankB: number;
  pairRank: number;
  totalPairs: number;
}

export interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  country: string;
  entryA: AccessLevel | undefined;
  entryB: AccessLevel | undefined;
}
