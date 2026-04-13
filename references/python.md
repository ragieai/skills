# Ragie Python SDK

The Python SDK mirrors the TypeScript SDK conceptually — same methods, snake_case naming.

```bash
pip install ragie
```

```python
import os
from ragie import Ragie

client = Ragie(auth=os.environ["RAGIE_API_KEY"])
```

## Ingestion

```python
# From a URL
doc = client.documents.create_from_url(request={
    "url": "https://example.com/report.pdf",
    "name": "Q4 Report",
    "partition": "tenant-42",
    "metadata": {"type": "report", "year": "2024"},
})

# From a file
with open("doc.pdf", "rb") as f:
    doc = client.documents.create_raw(request={
        "content": f.read(),
        "content_type": "application/pdf",
        "name": "doc.pdf",
    })

# From raw text
doc = client.documents.create_raw(request={
    "content": "Your text here...".encode(),
    "content_type": "text/plain",
    "name": "my-note",
})
```

## Polling for Readiness

```python
import time

def wait_for_ready(client, doc_id: str, timeout: int = 120) -> None:
    start = time.time()
    while time.time() - start < timeout:
        doc = client.documents.get(doc_id)
        if doc.status == "ready":
            return
        if doc.status == "failed":
            raise RuntimeError(f"Document {doc_id} failed")
        time.sleep(3)
    raise TimeoutError(f"Document {doc_id} not ready after {timeout}s")
```

## Retrieval

```python
results = client.retrievals.retrieve(request={
    "query": "your question",
    "top_k": 8,
    "rerank": True,
    "partition": "tenant-42",
    "filter": {"product": "api", "version": "v3"},
})

for chunk in results.scored_chunks:
    print(chunk.text, chunk.score)
    # also: chunk.document_id, chunk.document_name, chunk.document_metadata
```

## Bulk Ingestion (asyncio)

```python
import asyncio
from ragie import AsyncRagie

async def bulk_ingest(urls: list[str], partition: str):
    client = AsyncRagie(auth=os.environ["RAGIE_API_KEY"])
    tasks = [
        client.documents.create_from_url(request={"url": url, "partition": partition})
        for url in urls
    ]
    return await asyncio.gather(*tasks)
```

## Document Management

```python
doc = client.documents.get(doc_id)
page = client.documents.list(partition="tenant-42", page_size=50)
client.documents.update(doc_id, request={"metadata": {"reviewed": "true"}})
client.documents.delete(doc_id)
```

## RAG Response

```python
import anthropic

ragie = Ragie(auth=os.environ["RAGIE_API_KEY"])
claude = anthropic.Anthropic()

def answer(question: str) -> str:
    chunks = ragie.retrievals.retrieve(
        request={"query": question, "rerank": True, "top_k": 6}
    )
    context = "\n\n".join(c.text for c in chunks.scored_chunks)
    msg = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}],
    )
    return msg.content[0].text
```

## Webhook Handler (Flask)

```python
from flask import Flask, request

app = Flask(__name__)

@app.route("/webhooks/ragie", methods=["POST"])
def ragie_webhook():
    payload = request.json
    if payload["status"] == "ready":
        job_id = payload["metadata"].get("job_id")
        # notify downstream
    return "", 204
```

## Naming Differences vs TypeScript

| TypeScript | Python |
|------------|--------|
| `createFromUrl()` | `create_from_url()` |
| `createRaw()` | `create_raw()` |
| `topK` | `top_k` |
| `scoredChunks` | `scored_chunks` |
| `documentId` | `document_id` |
| `documentName` | `document_name` |
| `contentType` | `content_type` |
