# Idea Extraction Agent Memory Log

Last updated: 2026-03-10

## Active Objectives

- Parse raw text fed by the Research Agent.
- Synthesize NLP matches against known logic board ICs.
- Determine community confidence score.

## Historical Learnings (Long-Term Memory)

- Threads tagged with "SOLVED" or "FIXED" have a 90% higher probability of being accurate repair methods.
- "Hot" and "Short" are strong correlating keywords for capacitor failure.
- Known Component Watchlist: [CD3217, U2, Tristar, PMIC, PP_VDD_MAIN, NAND]

## Action Thresholds

Only forward ideas to the DB Agent if the extracted `confidence_score` is > 50%. Abandon ideas with low correlation.
