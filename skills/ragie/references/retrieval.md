# Ragie Retrieval

> Python user? See `references/python.md` for Python equivalents.

## Basic Retrieval

```typescript
const results = await client.retrievals.retrieve({
  query: "What are the rate limits?",
});
for (const chunk of results.scoredChunks) {
  console.log(chunk.text, chunk.score);
}
```

## Full Options

```typescript
const results = await client.retrievals.retrieve({
  query: "your question",
  topK: 8,                      // number of chunks returned (default 8)
  rerank: true,                 // cross-encoder rerank — improves quality significantly
  partition: "tenant-42",       // scope to a partition (optional)
  filter: {                     // metadata filter (optional) — see metadata-filtering.md
    product: "api",
    version: "v3",
  },
  maxChunksPerDocument: 2,      // limit chunks per source doc — improves source diversity (optional)
  recencyBias: false,           // favor more recently ingested documents (default false) (optional)
});
```

## Scored Chunk Fields

Each item in `scoredChunks` has:

| Field | Description |
|-------|-------------|
| `text` | The chunk text |
| `score` | Relevance score (higher = more relevant) |
| `documentId` | ID of the source document |
| `documentName` | Display name of the source document |
| `documentMetadata` | Metadata attached to the source document |
| `id` | The chunk's own ID |
| `index` | The chunk's position index within the document |
| `metadata` | Chunk-level metadata (distinct from `documentMetadata`) |

## Hybrid Search

Ragie automatically blends semantic (vector) and keyword (BM25) search on every query. No configuration needed.

`rerank: true` applies a cross-encoder on top of the hybrid results. Always enable for generation use cases:

```typescript
// Fast path — lower latency
const fast = await client.retrievals.retrieve({ query: q, rerank: false });

// Quality path — recommended for RAG
const best = await client.retrievals.retrieve({ query: q, rerank: true });
```

## Tuning topK

| Use case | Recommended topK |
|----------|------------------|
| Short-answer generation | 4–6 |
| Long-form generation | 8–12 |
| Exploratory / debugging | 20+ |

Too many chunks dilutes the context and increases token cost. Too few risks missing relevant content.

## Gotchas

- `rerank` adds ~100–300ms latency but meaningfully improves result quality. Use it by default.
- Metadata `filter` supports rich operators (`$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$and`, `$or`). Simple object shorthand `{ key: value }` is equality. See `metadata-filtering.md`.
- Scores are not normalized across queries; use them for ranking within a single result set, not across queries.
- Query documents only after `status === "ready"`. See `ingestion.md`.
