# Ragie Partitions

Partitions are logical namespaces within a single Ragie account. Use them to isolate documents by tenant, environment, project, or any other boundary.

> Python user? See `references/python.md` for Python equivalents.

## Basic Usage

```typescript
// Ingest into a partition
await client.documents.createFromUrl({
  url: "https://example.com/doc",
  partition: "tenant-42",
});

// Retrieve from that partition only
const results = await client.retrievals.retrieve({
  query: "pricing",
  partition: "tenant-42",
});
```

## Multi-Tenant Pattern

```typescript
function ingestForTenant(client: Ragie, tenantId: string, url: string) {
  return client.documents.createFromUrl({
    url,
    partition: `tenant-${tenantId}`,
  });
}

function retrieveForTenant(client: Ragie, tenantId: string, query: string) {
  return client.retrievals.retrieve({
    query,
    partition: `tenant-${tenantId}`,
    rerank: true,
  });
}
```

## Partition Management

```typescript
// List all partitions
const partitions = await client.partitions.list();

// Delete a partition and all its documents
await client.partitions.delete("tenant-42");
```

## Partitions vs Metadata Filters

| | Partitions | Metadata filters |
|-|------------|-----------------|
| Isolation | Hard — separate index | Soft — same index, filtered at query time |
| Use for | Multi-tenancy, environments | Document categories, versions, tags |
| Performance | Fastest (no cross-partition scan) | Slightly slower on large corpora |
| Deletion | Delete whole partition at once | Must delete documents individually |

Use partitions for tenant isolation. Use metadata filters for sub-categorization within a tenant. See `metadata-filtering.md`.

## Gotchas

- Omitting `partition` on ingest places the document in the default partition.
- Omitting `partition` on retrieval searches **only** the default partition — not all partitions.
- Partition names are case-sensitive. `Tenant-42` and `tenant-42` are different partitions.
- Deleting a partition is irreversible and deletes all documents within it.
