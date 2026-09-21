---
name: performance-analysis
description: How to evaluate performance implications of a change with evidence — hot paths, algorithmic complexity, DOM/render cost, memory — and avoid premature optimization. Use during review or when a requirement states performance goals.
---

# Performance analysis

Report performance findings only when supported by reasoning about complexity or by measurement.

## Procedure
1. **Is there a requirement?** A stated budget (latency, size, memory) beats intuition. With none, assess only obvious hazards.
2. **Identify hot paths**: what runs per keystroke/click/frame/request? Loops over unbounded data, repeated DOM queries, layout thrash (read/write interleaving), string concatenation in loops, re-render of unchanged UI, unbounded history/cache growth, blocking I/O.
3. **Complexity**: state big-O in the input that actually varies; note realistic input sizes.
4. **Measure when in doubt**: micro-benchmark in Node with many iterations (`performance.now()`, warm-up first) or a profile (`node --cpu-prof`); compare before/after on the same machine. One run is not evidence.
5. **Judge**: is it *material* at realistic scale? Flag only material issues; call trivial ones out as non-issues.

## Guard rails
No optimization without a measured or budgeted need; never trade correctness/readability for unmeasured speed; performance tests must not be flaky (use ratios/bounds with slack, or leave as reported measurements).

## Output
Finding(s) with location, evidence (complexity argument or numbers with method), expected impact, and a proportionate fix — or an explicit "no material performance risk: examined X, Y".
