# Ragie Quickstart

> Python user? See `references/python.md` for Python equivalents.

## Get an API Key

Sign up at [ragie.ai](https://ragie.ai) and copy the API key from the dashboard.

## Install the SDK

```bash
npm install ragie
```

## Ingest a Document

```typescript
import { Ragie } from "ragie";
import { openAsBlob } from "fs";

const client = new Ragie({ auth: process.env.RAGIE_API_KEY });

// From a file (PDF, DOCX, TXT, MD, …)
const doc = await client.documents.create({
  file: await openAsBlob("report.pdf"),
  name: "report.pdf",
});

// From raw text or JSON
const doc2 = await client.documents.createRaw({
  data: "Your text content here...",
  name: "my-note",
});

console.log(doc.id, doc.status); // status: "pending" → "ready"
```

See `ingestion.md` for URL ingestion, polling, webhooks, and bulk patterns.

## Retrieve (Search)

```typescript
const results = await client.retrievals.retrieve({
  query: "What are the key findings?",
  rerank: true,
});
for (const chunk of results.scoredChunks) {
  console.log(chunk.text, chunk.score);
}
```

## Environment Setup

Always load the API key from the environment:

```bash
export RAGIE_API_KEY=ragie_...
```

```typescript
import { Ragie } from "ragie";
const client = new Ragie({ auth: process.env.RAGIE_API_KEY });
```

## Gotchas

- Documents process **asynchronously** — `status` starts as `pending`, transitions to `ready`. Don't query before it's ready. See `ingestion.md` for polling/webhook patterns.
- `rerank: true` significantly improves result quality. Always enable it for generation use cases unless latency is critical.
