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

The Python SDK has three distinct methods depending on the source. Using the wrong one is a common source of errors.

| Source | Method | Request class |
|--------|--------|---------------|
| File upload (all file types) | `documents.create()` | `ragie.CreateDocumentParams` + `ragie.File` |
| In-memory data (text/JSON) | `documents.create_raw()` | `ragie.CreateDocumentRawParams` |
| URL | `documents.create_document_from_url()` | `ragie.CreateDocumentFromURLParams` |

**Prefer `documents.create()`** when uploading files from disk, as it supports all file types including binary formats. **Prefer `create_raw()`** when your data is already in memory as a string or dict — it is simpler and avoids unnecessary file wrapping, but only handles text and JSON.

### From a file

Use `documents.create()` with `ragie.File`. This is the only method that supports all file types including binary formats (PDF, DOCX, images, etc.).

```python
import ragie

with open("doc.pdf", "rb") as f:
    doc = client.documents.create(
        request=ragie.CreateDocumentParams(
            file=ragie.File(
                file_name="doc.pdf",
                content=f.read(),
                content_type="application/pdf",
            ),
            name="Q4 Report",
            partition="tenant-42",
            metadata={"type": "report", "year": "2024"},
        )
    )
```

### From a URL

```python
import ragie

doc = client.documents.create_document_from_url(
    request=ragie.CreateDocumentFromURLParams(
        url="https://example.com/report.pdf",
        name="Q4 Report",
        partition="tenant-42",
        metadata={"type": "report", "year": "2024"},
    )
)
```

### From in-memory data (raw text or JSON)

**Preferred when your data is already in memory** (e.g., scraped content, generated text, API responses). Accepts strings and dicts — not bytes.

```python
import ragie

doc = client.documents.create_raw(
    request=ragie.CreateDocumentRawParams(
        data="Your text content here...",  # str or dict
        name="my-note",
        partition="tenant-42",
    )
)
```

## Polling for Readiness

`documents.get()` returns `DocumentGet`, which is a **different type** from the `Document` returned by `create()` and `create_document_from_url()`. Both have `.status` and `.id`, but annotate them separately if you need type safety.

```python
import time
from ragie.models import DocumentGet

def wait_for_ready(client, doc_id: str, timeout: int = 120) -> None:
    start = time.time()
    while time.time() - start < timeout:
        doc: DocumentGet = client.documents.get(document_id=doc_id)
        if doc.status == "ready":
            return
        if doc.status == "failed":
            raise RuntimeError(f"Document {doc_id} failed")
        time.sleep(3)
    raise TimeoutError(f"Document {doc_id} not ready after {timeout}s")
```

## Retrieval

```python
import ragie

results = client.retrievals.retrieve(
    request=ragie.RetrieveParams(
        query="your question",
        top_k=8,
        rerank=True,
        partition="tenant-42",
        filter={"product": "api", "version": "v3"},
    )
)

for chunk in results.scored_chunks:
    print(chunk.text, chunk.score)
    # also: chunk.document_id, chunk.document_name, chunk.document_metadata
```

## Document Management

```python
import ragie
from ragie.models import DocumentGet

# Get a document — returns DocumentGet, not Document
doc: DocumentGet = client.documents.get(document_id=doc_id)

# List documents — use ListDocumentsRequest, not keyword args
# .result is a DocumentList object — access .result.documents for the list
page = client.documents.list(
    request=ragie.ListDocumentsRequest(partition="tenant-42", page_size=50)
)
docs = page.result.documents

# Paginate
while page is not None:
    for doc in page.result.documents:
        print(doc.id, doc.name)
    page = page.next()  # .next() returns the next page or None

# Update metadata (partial update — keyword args are required)
client.documents.patch_metadata(
    document_id=doc_id,
    patch_document_metadata_params=ragie.PatchDocumentMetadataParams(
        metadata={"reviewed": "true", "version": 4}
    ),
)

# Delete a document (keyword args are required)
client.documents.delete(document_id=doc_id)
```

## Bulk Ingestion (asyncio)

The Python SDK has no `AsyncRagie` class. Use `async with Ragie(...) as client:` and call the `_async`-suffixed method variants.

```python
import asyncio
import os
import ragie
from ragie import Ragie

async def bulk_ingest(urls: list[str], partition: str):
    async with Ragie(auth=os.environ["RAGIE_API_KEY"]) as client:
        tasks = [
            client.documents.create_document_from_url_async(
                request=ragie.CreateDocumentFromURLParams(url=url, partition=partition)
            )
            for url in urls
        ]
        return await asyncio.gather(*tasks)
```

## RAG Response

```python
import anthropic
import ragie

ragie_client = Ragie(auth=os.environ["RAGIE_API_KEY"])
claude = anthropic.Anthropic()

def answer(question: str) -> str:
    chunks = ragie_client.retrievals.retrieve(
        request=ragie.RetrieveParams(query=question, rerank=True, top_k=6)
    )
    context = "\n\n".join(c.text for c in chunks.scored_chunks)
    msg = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}],
    )
    return msg.content[0].text

def stream_answer(question: str) -> None:
    chunks = ragie_client.retrievals.retrieve(
        request=ragie.RetrieveParams(query=question, rerank=True, top_k=6)
    )
    context = "\n\n".join(c.text for c in chunks.scored_chunks)
    with claude.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}],
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
```

## Naming Differences vs TypeScript

| TypeScript | Python |
|------------|--------|
| `createDocumentFromUrl()` | `create_document_from_url()` |
| `createRaw()` | `create_raw()` |
| `topK` | `top_k` |
| `scoredChunks` | `scored_chunks` |
| `documentId` | `document_id` |
| `documentName` | `document_name` |
| `contentType` | `content_type` |

## Gotchas

- **`ragie.File`, not `ragie.FileUpload`** — the file wrapper class is `ragie.File`. `FileUpload` does not exist.
- **`ragie.ListDocumentsRequest`, not `ragie.ListDocumentsParams`** — always use the `Request` suffix for list operations.
- **Prefer `create_raw()` for in-memory data** — it's simpler when you already have a string or dict. **Prefer `create()` for file uploads** — it supports all file types. `create_raw()` only handles text and JSON; binary files (PDF, DOCX, etc.) must use `create()` with `ragie.File`.
- **`documents.list()` response requires `.result.documents`** — `.result` is a `DocumentList` object, not a list. Access `.result.documents` to get the actual `List[Document]`. Iterating `.result` directly yields Pydantic field tuples, not documents.
- **`documents.get()` returns `DocumentGet`, not `Document`** — these are distinct types. Import `from ragie.models import DocumentGet` and annotate accordingly. Do not assign a `DocumentGet` to a variable typed as `Document`.
- **Pagination via `.next()`** — call `page.next()` to get the next `ListDocumentsResponse`, or `None` if there are no more pages.
- **Keyword-only arguments** — `delete`, `patch_metadata`, and similar methods use keyword-only args (`*` in signature). Always pass `document_id=doc_id`, never positionally.
- **No `AsyncRagie` class** — there is only `Ragie`. For async usage, open it as a context manager (`async with Ragie(...) as client:`) and call `_async`-suffixed methods: `create_async()`, `create_document_from_url_async()`, `create_raw_async()`, etc.
