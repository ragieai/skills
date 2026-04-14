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
    version: 3,          // numbers are allowed
    active: true,        // booleans are allowed
    tags: ["public", "stable"],  // list of strings is allowed
  },
});
```

Metadata values can be: **strings**, **numbers** (stored as 64-bit float), **booleans**, or **lists of strings**. Keys set to `null` in a patch operation are deleted.

## Filtering at Retrieval

### Simple equality (shorthand)

```typescript
const results = await client.retrievals.retrieve({
  query: "rate limits",
  filter: {
    product: "api",
    version: 3,
  },
});
```

All keys in a plain object filter must match — it's an implicit `$and` of equality checks.

### Filter operators

For range, set membership, and logical combinations use explicit operators:

```typescript
// Greater than / less than
filter: { year: { $gt: 2022 } }
filter: { score: { $gte: 0.8, $lte: 1.0 } }

// Not equal
filter: { status: { $ne: "draft" } }

// In / not in a set
filter: { lang: { $in: ["en", "fr"] } }
filter: { env: { $nin: ["test", "staging"] } }

// Logical OR
filter: {
  $or: [
    { product: "api" },
    { product: "dashboard" }
  ]
}

// Logical AND with sub-conditions
filter: {
  $and: [
    { product: "api" },
    { version: { $gte: 2 } }
  ]
}
```

| Operator | Purpose | Supported types |
|----------|---------|-----------------|
| `$eq` | Equal | number, string, boolean |
| `$ne` | Not equal | number, string, boolean |
| `$gt` | Greater than | number only |
| `$gte` | Greater than or equal | number only |
| `$lt` | Less than | number only |
| `$lte` | Less than or equal | number only |
| `$in` | Value in array | string or number |
| `$nin` | Value not in array | string or number |
| `$and` | Logical AND | compound |
| `$or` | Logical OR | compound |

## Updating Metadata

```typescript
// Partial update — only specified keys are changed; keys set to null are deleted
await client.documents.patchMetadata({
  documentId: docId,
  patchDocumentMetadataParams: { metadata: { reviewed: "true", version: 4 } },
});
```

## Common Patterns

### Product + version scoping

```typescript
// Tag by product and version on ingest
await client.documents.createDocumentFromUrl({
  url,
  metadata: { product: "dashboard", version: 4 },
});

// Query only that version's docs
const results = await client.retrievals.retrieve({
  query: "usage metrics",
  filter: { product: "dashboard", version: 4 },
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

### Date range filtering

```typescript
// Store dates as Unix timestamps (numbers)
metadata: { published_at: 1704067200 }

// Query documents published after 2024-01-01
filter: { published_at: { $gt: 1704067200 } }
```

## Metadata vs Partitions

Metadata filtering and partitions serve different purposes — see `partitions.md` for the comparison.

## Gotchas

- Metadata values may be strings, numbers, booleans, or lists of strings. Numbers do **not** need to be stringified — use native numbers for range operators to work correctly.
- Filtering on a key that doesn't exist on a document excludes that document from results.
- Reserved keys (will cause a 422 error): `document_id`, `document_type`, `document_source`, `document_name`, `document_uploaded_at`. Keys beginning with `_` are also reserved.
- Metadata filtering is a **pre-filter**: Ragie guarantees `top_k` results if they exist after filtering.
- Up to 1000 total metadata values per document (each item in an array counts toward the total).
