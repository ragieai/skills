# Ragie REST API Reference

Base URL: `https://api.ragie.ai`

Authentication: `Authorization: Bearer <RAGIE_API_KEY>` on every request.

---

## Documents

### Create document from URL

```
POST /documents
Content-Type: application/json

{
  "url": "https://example.com/page",
  "name": "My Doc",           // optional display name
  "partition": "tenant-id",   // optional partition
  "metadata": {}              // optional key-value metadata
}
```

### Create document from raw bytes

```
POST /documents/raw
Content-Type: multipart/form-data

content       <file bytes>
content_type  application/pdf | text/plain | text/markdown | ...
name          <string>
partition     <string>   (optional)
metadata      <json>     (optional)
```

### Get document

```
GET /documents/{document_id}
```

Response fields: `id`, `name`, `status` (`pending` | `partitioning` | `ready` | `failed`), `metadata`, `partition`, `created_at`, `updated_at`.

### List documents

```
GET /documents?partition=<p>&page_size=<n>&cursor=<c>
```

Returns `{ "results": [...], "pagination": { "next_cursor": "..." } }`.

### Update document metadata

```
PATCH /documents/{document_id}
Content-Type: application/json

{
  "metadata": { "key": "value" }
}
```

### Delete document

```
DELETE /documents/{document_id}
```

---

## Retrievals

### Retrieve chunks

```
POST /retrievals
Content-Type: application/json

{
  "query": "What are the rate limits?",
  "top_k": 8,               // default 8, max 100
  "rerank": true,           // cross-encoder rerank (recommended)
  "partition": "tenant-id", // scope to partition (optional)
  "filter": {               // metadata equality filter (optional)
    "product": "api"
  }
}
```

Response:

```json
{
  "scored_chunks": [
    {
      "text": "...",
      "score": 0.92,
      "document_id": "doc_...",
      "document_name": "API Docs",
      "document_metadata": {}
    }
  ]
}
```

---

## Partitions

### List partitions

```
GET /partitions
```

### Delete partition (and all its documents)

```
DELETE /partitions/{partition_id}
```

---

## Webhooks / Ready Hook

Pass `metadata.ready_hook` on ingest to receive a POST when processing completes:

```json
{
  "url": "https://example.com/doc",
  "metadata": {
    "ready_hook": "https://your-server.com/ragie-webhook"
  }
}
```

Ragie will POST to that URL with the document object when `status` transitions to `ready` or `failed`.

---

## Error Codes

| HTTP | Meaning |
|------|---------|
| 400 | Bad request — check request body |
| 401 | Invalid or missing API key |
| 404 | Document / partition not found |
| 422 | Validation error — response body has `detail` array |
| 429 | Rate limited — retry with exponential back-off |
| 5xx | Server error — retry |

---

## SDK Install & Auth

### TypeScript / Node

```bash
npm install ragie
```

```typescript
import { Ragie } from "ragie";
const client = new Ragie({ auth: process.env.RAGIE_API_KEY });
```

### Python

```bash
pip install ragie
```

```python
from ragie import Ragie
client = Ragie(auth=os.environ["RAGIE_API_KEY"])
```

All SDK methods mirror the REST endpoints and return typed response objects. The SDKs handle pagination, retries, and multipart uploads automatically.

Note: The TypeScript SDK uses camelCase (`createFromUrl`, `topK`, `scoredChunks`). The REST API and Python SDK use snake_case (`create_from_url`, `top_k`, `scored_chunks`).
