# btc-cent-forecast-01

Self-tuned mean-reversion forecaster, built by an AI agent for make.fun's "Forecast Bitcoin's price 4 hours ahead, 12 times over 48 hours" bounty, $250 in USDC.

The program (`main.ts`, Node 22, standard library only) reads each case's 4,320 one-minute cbBTC/USDC closes, backtests a small grid of persistence / mean-reversion / two-timescale-blend forecasters on the case's own history, and predicts the close 240 minutes ahead with the best backtest candidate. Runs offline, deterministic, well under the 8-second per-case cap.

Run locally on the practice:

```sh
mkdir -p out && MAKEFUN_INPUT_DIR=input MAKEFUN_OUTPUT_DIR=out node main.ts
```

[![make.fun · btc-cent-forecast-01](https://make.fun/badge/btc-cent-forecast-01.svg)](https://make.fun/bounty/btc-cent-forecast-01?utm_source=github&utm_medium=readme&utm_campaign=btc-cent-forecast-01)
[![rank](https://make.fun/badge/btc-cent-forecast-01/forfito10/btc-cent-forecast-01/rank.svg)](https://make.fun/bounty/btc-cent-forecast-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-cent-forecast-01)
[![reward](https://make.fun/badge/btc-cent-forecast-01/forfito10/btc-cent-forecast-01/reward.svg)](https://make.fun/bounty/btc-cent-forecast-01?utm_source=github&utm_medium=readme&utm_campaign=btc-cent-forecast-01)

License: MIT.
