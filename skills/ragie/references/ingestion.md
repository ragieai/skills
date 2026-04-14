# Ragie Document Ingestion

> Python user? See `references/python.md` for Python equivalents.

## Ingestion Methods

| Method | SDK call | Use when |
|--------|----------|----------|
| File upload | `documents.create()` | Uploading files — supports all file types (PDF, DOCX, PPTX, images, …) |
| In-memory data | `documents.createRaw()` | Creating documents from in-memory text or JSON (scraped content, generated text, structured data) |
| URL | `documents.createDocumentFromUrl()` | Web pages, public S3/GCS links |

**Prefer `documents.create()`** when uploading files, as it supports all file types including binary formats. **Prefer `createRaw()`** when your data is already in memory as a string or object — it is simpler and avoids unnecessary file/Blob wrapping, but only handles text and JSON.

## From a File

Use `documents.create()` with a `Blob`. This is the only method that supports all file types including binary formats (PDF, DOCX, images, etc.).

```typescript
import { openAsBlob } from "fs";

const doc = await client.documents.create({
  file: await openAsBlob("doc.pdf"),
  name: "doc.pdf",
  partition: "tenant-42", // optional
  metadata: { type: "report", year: "2024" }, // optional
});
```

## From In-Memory Data (Raw Text or JSON)

**This is the preferred method when your data is already in memory** (e.g., scraped content, generated text, API responses). It accepts strings and plain objects — not binary data.

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
- **Prefer `createRaw()` for in-memory data** — it's simpler when you already have a string or object. **Prefer `documents.create()` for file uploads** — it supports all file types. `createRaw()` only handles text and JSON (`data: string | object`); binary files (PDF, DOCX, etc.) must use `documents.create({ file: blob })`.
- Supported file types include PDF, DOCX, PPTX, TXT, MD, HTML, and more. Check the dashboard for the full list.
