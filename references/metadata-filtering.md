# Ragie Metadata Filtering

Metadata is arbitrary key-value pairs attached to documents at ingest time. Use them to filter retrieval to a relevant subset of documents.

> Python user? See `references/python.md` for Python equivalents.

## Attaching Metadata on Ingest

```typescript
await client.documents.createRaw({
  content: contentBuffer,
  contentType: "application/pdf",
  name: "API Docs v3",
  metadata: {
    product: "api",
    version: "v3",
    lang: "en",
    scope: "public",
  },
});
```

## Filtering at Retrieval

```typescript
const results = await client.retrievals.retrieve({
  query: "rate limits",
  filter: {
    product: "api",
    version: "v3",
  },
});
```

All keys in `filter` must match for a chunk to be included. There is no partial match or OR logic — the filter is a strict equality AND across all specified keys.

## Updating Metadata

```typescript
await client.documents.update(docId, {
  metadata: { reviewed: "true", version: "v4" },
});
```

## Common Patterns

### Product + version scoping

```typescript
// Tag by product and version on ingest
await client.documents.createFromUrl({
  url,
  metadata: { product: "dashboard", version: "2024-q4" },
});

// Query only that version's docs
const results = await client.retrievals.retrieve({
  query: "usage metrics",
  filter: { product: "dashboard", version: "2024-q4" },
});
```

### Language filtering

```typescript
metadata: { lang: "fr" }
filter: { lang: "fr" }
```

### Environment separation

```typescript
metadata: { env: "staging" }
filter: { env: "staging" }
```

## Metadata vs Partitions

Metadata filtering and partitions serve different purposes — see `partitions.md` for the comparison.

## Gotchas

- All metadata values must be **strings**. Store numbers and booleans as `"42"`, `"true"`.
- Filtering on a key that doesn't exist on a document excludes that document from results.
- There is no `OR` or range filter. For complex filtering, consider separate partitions or pre-filter document IDs in your own database.
