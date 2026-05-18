# PASSPORT PAIR PORTAL

> Find the strongest combination of two passports. Visualize global access. Compare any pair of countries.

---

## What this is

Given any two travel documents from different countries, Travel Reach computes the total number of destinations reachable by either document, ranks that combination against all ~19,701 possible passport pairs, and renders the result on a Robinson-projection world map — colored by which document covers each country. There is no backend. All computation runs in the browser at load time from a single CSV file.

---

## The problem, explained

A document's individual strength is measured by how many destinations it can enter without prior embassy approval — visa-free, visa on arrival, or e-visa. When you hold two documents, your effective reach is the **union** of both sets, not the sum. The union is always smaller than or equal to the sum because some destinations are accessible by both documents simultaneously.

The most powerful pairs are not the two strongest individual documents — they are the pairs where each document covers a different region of the world with minimal overlap.

```
  ┌──────────────────────────────────────────────────┐
  │                     neither                      │
  │                                                  │
  │   ┌─────────────────────┐                        │
  │   │          ┌──────────────────────┐            │
  │   │  A only  │  A ∩ B   │  B only  │            │
  │   │          │  (both)  │          │            │
  │   └─────────────────────┘          │            │
  │              └──────────────────────┘            │
  │                                                  │
  └──────────────────────────────────────────────────┘
```

| Zone | Meaning |
|------|---------|
| A only | Destinations reachable by Document A, not B |
| B only | Destinations reachable by Document B, not A |
| A ∩ B | Destinations reachable by both (the overlap) |
| Neither | Restricted by both documents |
| A ∪ B | **Combined reach** — the metric that matters |

---

## Data model

Source: [passport-index-dataset by ilyankou](https://github.com/ilyankou/passport-index-dataset)

The dataset is a matrix CSV where each row represents one passport–destination pair.

| Column | Description | Example |
|--------|-------------|---------|
| Passport | Issuing country | Indonesia |
| Destination | Destination country | Japan |
| Value | Numeric access level | 3 |

Access levels are normalized at parse time from text labels:

| Value | Label | Meaning |
|-------|-------|---------|
| 3 | OPEN | No prior approval needed (visa-free or day-count entries) |
| 2 | ARRIVAL | Approval granted at the border (visa on arrival) |
| 1 | ELECTRONIC | Online approval before travel (e-visa, ETA) |
| 0 | RESTRICTED | Embassy approval required |
| -1 | N/A | Own country or non-existent route |

A destination is considered **reachable** if its access level is ≥ 2 (OPEN or ARRIVAL).

---

## The algorithm

1. Parse the CSV into a map: `data[passport][destination] → AccessLevel`
2. For each passport, compute its individual score: count of destinations with level ≥ 2
3. Rank all passports by individual score descending
4. Generate all unique passport pairs (n choose 2, where n = 199 countries → 19,701 pairs)
5. For each pair, compute the union score: count of destinations reachable by either document
6. Sort all pairs by union score descending — this is the pair ranking
7. Store pair ranks in a `Map<"A|B", rank>` for O(1) lookup during rendering

Example pair computation:

| Metric | Value |
|--------|-------|
| Document A reachable | 143 destinations |
| Document B reachable | 112 destinations |
| Reachable by both (A ∩ B) | 98 destinations |
| Reachable by A only | 45 destinations |
| Reachable by B only | 14 destinations |
| Combined reach (A ∪ B) | 157 destinations |
| Pair rank | #312 of 19,701 pairs |

All ~19,701 pairs are precomputed at load time. The sorted list is built once; subsequent lookups for any pair's rank are O(1) via the hash map.

---

## Map color legend

| Color | Hex | Meaning |
|-------|-----|---------|
| Yellow-green | `#c8f04a` | Reachable by both documents |
| Blue | `#4a90c8` | Reachable by Document A only |
| Red | `#c84a4a` | Reachable by Document B only |
| Dark gray | `#2a2a2a` | Restricted by both |
| Mid gray | `#555555` | Selected home countries |

The map uses the Robinson projection via `react-simple-maps` and `d3-geo-projection`. Country names in the TopoJSON source are bridged to CSV names via a 12-entry lookup table where abbreviations diverge (e.g. `"Czechia"` → `"Czech Republic"`).

---

## Auto-update system

The dataset updates automatically every Monday at 00:00 UTC via a GitHub Actions workflow.

```
Every Monday 00:00 UTC
        |
        v
Fetch latest CSV from passport-index-dataset
        |
        v
Compare with current public/data/travel-index.csv
        |
   changed? ----NO----> stop
        |
       YES
        |
        v
Commit and push updated CSV
        |
        v
Vercel / Netlify detects push
        |
        v
Automatic redeploy with fresh data
```

The workflow also exposes a `workflow_dispatch` trigger for manual runs.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| Bundler | Vite |
| Map | react-simple-maps (Robinson projection) + d3-geo-projection |
| CSV parsing | papaparse |
| Styling | Plain CSS with CSS custom properties |
| Data updates | GitHub Actions (scheduled, weekly) |
| Deployment | Vercel or Netlify (fully static, no SSR) |

---

## Local development

```bash
git clone https://github.com/your-username/travel-reach.git
cd travel-reach
npm install
npm run dev
```

The app is served at . The travel data CSV is read from `public/data/travel-index.csv` at runtime — no environment variables or API keys required.

To build for production:

```bash
npm run build
npm run preview
```

---

## Data attribution

Travel access data is sourced from the [passport-index-dataset](https://github.com/ilyankou/passport-index-dataset) maintained by **ilyankou**. The dataset is updated regularly and reflects current visa policies. This project fetches the latest version automatically each week via the GitHub Actions workflow described above.
