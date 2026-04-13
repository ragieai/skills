# Ragie Document Ingestion

> Python user? See `references/python.md` for Python equivalents.

## Ingestion Methods

| Method | SDK call | Use when |
|--------|----------|----------|
| URL | `documents.createFromUrl()` | Web pages, public S3/GCS links |
| Raw bytes | `documents.createRaw()` | Local files (PDF, DOCX, TXT, MD, …) |
| Raw text | `documents.createRaw()` with `text/plain` | Strings, scraped content |

## From a URL

```typescript
const doc = await client.documents.createFromUrl({
  url: "https://example.com/report.pdf",
  name: "Q4 Report",              // optional display name
  partition: "tenant-42",         // optional partition
  metadata: { type: "report", year: "2024" }, // optional
});
```

## From a File

```typescript
import { readFileSync } from "fs";

const doc = await client.documents.createRaw({
  content: readFileSync("doc.pdf"),
  contentType: "application/pdf",
  name: "doc.pdf",
  partition: "tenant-42", // optional
});
```

## From Raw Text

```typescript
const doc = await client.documents.createRaw({
  content: Buffer.from("Your text content here..."),
  contentType: "text/plain",
  name: "my-note",
});
```

## Document Lifecycle

Documents are processed asynchronously: `pending` → `partitioning` → `ready` (or `failed`).

### Polling for Readiness

```typescript
async function waitForReady(
  client: Ragie,
  docId: string,
  timeoutMs = 120_000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const doc = await client.documents.get(docId);
    if (doc.status === "ready") return;
    if (doc.status === "failed") throw new Error(`Document ${docId} failed`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`Document ${docId} not ready after ${timeoutMs}ms`);
}

const doc = await client.documents.createFromUrl({ url });
await waitForReady(client, doc.id);
// now safe to retrieve
```

### Webhook (ready_hook)

Pass `metadata.readyHook` to receive a POST when processing completes:

```typescript
const doc = await client.documents.createFromUrl({
  url: "https://source.example.com/report.pdf",
  metadata: {
    readyHook: "https://your-app.example.com/webhooks/ragie",
    jobId: "job-123",
  },
});
```

```typescript
// Next.js / Express webhook handler
app.post("/webhooks/ragie", (req, res) => {
  const payload = req.body;
  if (payload.status === "ready") {
    const jobId = payload.metadata.jobId;
    // notify downstream
  }
  res.sendStatus(204);
});
```

## Bulk Ingestion

```typescript
const docs = await Promise.all(
  urls.map((url) =>
    client.documents.createFromUrl({ url, partition: "my-partition" })
  )
);
```

## Document Management

```typescript
// Get a document
const doc = await client.documents.get(docId);

// List documents
const page = await client.documents.list({ partition: "tenant-42", pageSize: 50 });

// Update metadata
await client.documents.update(docId, { metadata: { reviewed: "true" } });

// Delete a document
await client.documents.delete(docId);
```

## Gotchas

- Always check `status === "ready"` before querying — newly ingested documents are not immediately searchable.
- The `readyHook` URL must be publicly reachable. Use polling in local dev environments.
- Supported file types include PDF, DOCX, PPTX, TXT, MD, HTML, and more. Check the dashboard for the full list.
