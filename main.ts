// btc-cent-forecast-01 entry: self-tuned mean-reversion forecaster (Node 22, stdlib only).
// For each case, backtests a small grid of forecasters on the case's own 4320 one-minute closes
// and picks the parameters with the lowest backtest mean absolute error, with persistence as a
// guaranteed-eligible fallback (a house-baseline-quality guess). Deterministic: no randomness.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const MIN_PRICE = 0.00001;
const MAX_PRICE = 9_999_999.99999;
const H = 240; // horizon in minutes

const price5 = (x: number): number =>
  Math.round(Math.min(MAX_PRICE, Math.max(MIN_PRICE, x)) * 1e5) / 1e5;

interface Case {
  markets: { id: string; prices: number[] }[];
}

function mean(a: number[], lo: number, hi: number): number {
  let s = 0;
  for (let i = lo; i < hi; i++) s += a[i];
  return s / (hi - lo);
}

// Mean-reversion forecaster: pull the last price toward the mean of the last k minutes.
function mr(prices: number[], i: number, k: number, a: number): number {
  const m = mean(prices, i - k, i);
  return prices[i] + a * (m - prices[i]);
}

// Two-timescale blend: pull toward a short-window mean (fast) and a long-window mean (slow),
// each with its own strength, combined by weight w.
function blend(prices: number[], i: number, k1: number, a1: number, k2: number, a2: number, w: number): number {
  const m1 = mean(prices, i - k1, i);
  const m2 = mean(prices, i - k2, i);
  return prices[i] + w * a1 * (m1 - prices[i]) + (1 - w) * a2 * (m2 - prices[i]);
}

// Grid of candidate forecasters (f(prices, i) -> guess for prices[i + H]).
type Cand = { name: string; f: (p: number[], i: number) => number };
const GRID: Cand[] = [{ name: 'persist', f: (p, i) => p[i] }];
for (const k of [120, 180, 240, 360, 480, 720, 1440]) {
  for (const a of [0.05, 0.1, 0.2, 0.3, 0.4, 0.5]) {
    GRID.push({ name: `mr${k}-${a}`, f: (p, i) => mr(p, i, k, a) });
  }
}
for (const k1 of [180, 360]) {
  for (const a1 of [0.1, 0.2]) {
    for (const k2 of [720, 1440]) {
      for (const a2 of [0.05, 0.1, 0.2]) {
        for (const w of [0.5, 0.7]) {
          GRID.push({ name: `bl${k1}-${a1}-${k2}-${a2}-${w}`, f: (p, i) => blend(p, i, k1, a1, k2, a2, w) });
        }
      }
    }
  }
}

// Backtest every candidate on checkpoints spread over the case's own history.
function pick(prices: number[]): Cand {
  const n = prices.length;
  const cps: number[] = [];
  for (let i = 1440; i + H < n; i += 30) cps.push(i);
  if (cps.length === 0) return GRID[0] as Cand; // persistence for tiny inputs
  let best = GRID[0] as Cand;
  let bestErr = Infinity;
  for (const c of GRID) {
    let s = 0;
    for (const i of cps) s += Math.abs(c.f(prices, i) - prices[i + H]);
    const e = s / cps.length;
    if (e < bestErr - 1e-9) { bestErr = e; best = c; } // ties keep persistence (first)
  }
  return best;
}

function forecast(c: Case): number {
  if (!Array.isArray(c.markets) || c.markets.length !== 1) throw new Error('expected exactly one market');
  const prices = c.markets[0]!.prices;
  if (!Array.isArray(prices) || prices.length === 0) throw new Error('market has no prices');
  const i = prices.length - 1;
  if (i < 1440) return price5(prices[i]!); // not enough history: persistence
  return price5(pick(prices).f(prices, i));
}

mkdirSync(OUTPUT_DIR, { recursive: true });
const inputs = readdirSync(INPUT_DIR).filter((f) => f.endsWith('.in')).sort();
for (const file of inputs) {
  const id = file.slice(0, -'.in'.length);
  const c = JSON.parse(readFileSync(join(INPUT_DIR, file), 'utf8')) as Case;
  writeFileSync(
    join(OUTPUT_DIR, `${id}.out`),
    `${JSON.stringify({ forecasts: [{ case: id, price: forecast(c) }] })}\n`,
  );
}
