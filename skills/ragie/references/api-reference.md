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

Response fields: `id`, `name`, `status` (`pending` | `partitioning` | `partitioned` | `refined` | `chunked` | `indexed` | `summary_indexed` | `keyword_indexed` | `ready` | `failed`), `metadata`, `partition`, `created_at`, `updated_at`.

### List documents

```
GET /documents?page_size=<n>&cursor=<c>&filter=<json>
Partition: <partition>    ← partition is a header, not a query param
```

Returns `{ "results": [...], "pagination": { "next_cursor": "..." } }`.

### Update document metadata

```
PATCH /documents/{document_id}/metadata
Content-Type: application/json

{
  "metadata": { "key": "value" }
}
```

Performs a partial update. Keys set to `null` are deleted.

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
  "top_k": 8,                       // default 8
  "rerank": true,                   // cross-encoder rerank (recommended)
  "partition": "tenant-id",         // scope to partition (optional)
  "filter": { "product": "api" },   // metadata filter (optional)
  "max_chunks_per_document": 2,     // limit chunks per source doc (optional)
  "recency_bias": false             // favor recently ingested docs (optional)
}
```

Response:

```json
{
  "scored_chunks": [
    {
      "id": "chunk_...",
      "index": 0,
      "text": "...",
      "score": 0.92,
      "document_id": "doc_...",
      "document_name": "API Docs",
      "document_metadata": {},
      "metadata": {}
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

### Create partition

```
POST /partitions
Content-Type: application/json

{ "name": "tenant-42", "description": "optional" }
```

### Get partition (usage metrics)

```
GET /partitions/{partition_id}
```

Returns document count, pages processed/hosted monthly/total.

### Delete partition (and all its documents)

```
DELETE /partitions/{partition_id}
```

---

## Webhooks

Register a webhook endpoint to receive document status change events:

```
POST /webhook_endpoints
Content-Type: application/json

{ "url": "https://your-server.com/ragie-webhook" }
```

Ragie sends `document_status_updated` events when documents reach `indexed`, `keyword_indexed`, `ready`, or `failed` states.

---

## Error Codes

| HTTP | Meaning |
|------|---------|
| 401 | Invalid or missing API key |
| 402 | Usage limit exceeded |
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

Note: The TypeScript SDK uses camelCase (`createDocumentFromUrl`, `topK`, `scoredChunks`, `patchMetadata`). The REST API and Python SDK use snake_case (`create_document_from_url`, `top_k`, `scored_chunks`, `patch_metadata`).
