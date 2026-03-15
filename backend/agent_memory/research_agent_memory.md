# Research Agent Memory Log

Last updated: 2026-03-10

## Active Objectives

- Crawl public repair forums (BadCaps, iFixit, iPhone repair subreddits) for the latest failure points.
- Identify new anomalies in Apple Silicon M1/M2/M3 logic boards.

## Historical Learnings (Long-Term Memory)

- CD3217 failures are massively trending on M-series boards. Often show 5V 0.02A.
- M92T36 is the most common failure on Nintendo Switch causing no-charge.
- Discovered that fake charging is almost always Tristar/U2 related on older iPhones.

## Scraping Logic

Currently scraping text from `title` and `content` tags.
Will ignore threads marked as "Unsolved" to only feed verified solutions to the Idea Agent.
