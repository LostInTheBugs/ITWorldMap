# Token usage tracking — ITWorldMap

LLM token usage for this project, tallied session by session.

## Cumulative tally (2026-08-02)

| Metric | Value |
|---|---|
| Dev sessions (Hermes) | 2 |
| Scripted agent sessions (API) | 1 |
| Models | deepseek-v4-pro |
| Messages | 1 693 |
| API calls | 812 |
| Input tokens | 639 267 |
| Output tokens | 213 262 |
| Of which reasoning | 63 412 |
| Cache read (cache_read) | 133 015 552 |
| Cache write (cache_write) | 0 |
| **Total (input + output)** | **852 529** |
| Estimated cost | ≈ 0.946 USD |

> The creation session (Jul 21) carries a generic title (« Modèle IA de l'assistant ») but contains the full genesis of the project; the second one (Jul 26) is the IPv6 cleanup.

## How to re-read the counter

The Hermes session database (SQLite) holds the exact counters:

```bash
sqlite3 ~/.hermes/state.db "SELECT id, started_at, model,
  input_tokens, output_tokens, cache_read_tokens, cache_write_tokens,
  reasoning_tokens, estimated_cost_usd
  FROM sessions WHERE cwd LIKE '%ITWorldMap%'
  ORDER BY started_at;"
```

After each dev session, copy the matching row into the table above.

## Notes

- Tally taken from `~/.hermes/state.db` (table `sessions`) — these are the
  real runtime counters, not an estimate.
- « Scripted agent sessions (API) » = `api-*` sessions driven by scripts
  (audits, releases, background tasks) attached to this project.
- `reasoning_tokens` is probably included in `output_tokens`
  (to be confirmed with the provider).
- Tally generated on 2026-08-02 from the session database.
