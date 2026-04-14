# Ragie Document Ingestion

> Python user? See `references/python.md` for Python equivalents.

## Ingestion Methods

| Method | SDK call | Use when |
|--------|----------|----------|
| Binary file | `documents.create()` | Local files (PDF, DOCX, PPTX, images, …) |
| Raw text/JSON | `documents.createRaw()` | Strings, scraped content, JSON data |
| URL | `documents.createDocumentFromUrl()` | Web pages, public S3/GCS links |

## From a Binary File

Use `documents.create()` with a `Blob`. **Do not use `createRaw()` for binary files** — `createRaw()` is text/JSON only.

```typescript
import { openAsBlob } from "fs";

const doc = await client.documents.create({
  file: await openAsBlob("doc.pdf"),
  name: "doc.pdf",
  partition: "tenant-42", // optional
  metadata: { type: "report", year: "2024" }, // optional
});
```

## From Raw Text or JSON

```typescript
const doc = await client.documents.createRaw({
  data: "Your text content here...",  // string or plain object (not binary)
  name: "my-note",
  partition: "tenant-42", // optional
});
```

## From a URL

```typescript
const doc = await client.documents.createDocumentFromUrl({
  url: "https://example.com/report.pdf",
  name: "Q4 Report",              // optional display name
  partition: "tenant-42",         // optional partition
  metadata: { type: "report", year: "2024" }, // optional
});
```

## Document Lifecycle

Documents are processed asynchronously through several stages:

`pending` → `partitioning` → `partitioned` → `refined` → `chunked` → `indexed` → `summary_indexed` → `keyword_indexed` → `ready` (or `failed`)

For polling, check `status === "ready"` or `status === "failed"`. Intermediate stages are informational.

### Polling for Readiness

```typescript
async function waitForReady(
  client: Ragie,
  docId: string,
  timeoutMs = 120_000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const doc = await client.documents.get({ documentId: docId });
    if (doc.status === "ready") return;
    if (doc.status === "failed") throw new Error(`Document ${docId} failed`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`Document ${docId} not ready after ${timeoutMs}ms`);
}

const doc = await client.documents.createDocumentFromUrl({ url });
await waitForReady(client, doc.id);
// now safe to retrieve
```

### Webhooks

Ragie can POST to your server when a document's status changes. Register a webhook endpoint via the Ragie dashboard or `POST /webhook_endpoints`. Ragie sends `document_status_updated` events when documents reach `indexed`, `keyword_indexed`, `ready`, or `failed` states.

Use polling during local development; register a webhook endpoint for production.

## Bulk Ingestion

```typescript
const docs = await Promise.all(
  urls.map((url) =>
    client.documents.createDocumentFromUrl({ url, partition: "my-partition" })
  )
);
```

## Document Management

```typescript
// Get a document
const doc = await client.documents.get({ documentId: docId });

// List documents (returns a PageIterator — async iterable)
for await (const page of client.documents.list({ partition: "tenant-42", pageSize: 50 })) {
  for (const doc of page.result.documents) {
    console.log(doc.id, doc.name, doc.status);
  }
}

// Update metadata (partial update — keys set to null are deleted)
await client.documents.patchMetadata({
  documentId: docId,
  patchDocumentMetadataParams: { metadata: { reviewed: "true", version: "v4" } },
});

// Delete a document
await client.documents.delete({ documentId: docId });
```

## Gotchas

- Always check `status === "ready"` before querying — newly ingested documents are not immediately searchable.
- `createRaw()` is for **text and JSON only** (`data: string | object`). Binary files (PDF, DOCX, etc.) must use `documents.create({ file: blob })`.
- Supported file types include PDF, DOCX, PPTX, TXT, MD, HTML, and more. Check the dashboard for the full list.
