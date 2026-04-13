---
name: ragie
description: >
  This skill should be used when the user wants to "add Ragie to my project", "integrate Ragie",
  "use Ragie for RAG", "ingest documents with Ragie", "search documents with Ragie",
  "set up document retrieval", "build a RAG pipeline", "use the Ragie MCP", "query my knowledge base",
  "connect Ragie to Claude", or mentions Ragie in the context of document search, retrieval-augmented
  generation, or knowledge base management. Provides end-to-end guidance for the Ragie managed RAG
  platform: SDK setup, document ingestion, retrieval, MCP usage, and RAG application patterns.
version: "1.0.0"
---

# Ragie

Ragie is a fully managed RAG (Retrieval-Augmented Generation) platform. It handles document ingestion, chunking, embedding, and retrieval — available via REST API, Python/TypeScript SDKs, and an MCP server.

## References

Load the relevant reference for the task at hand:

| Reference | When to load |
|-----------|--------------|
| `references/quickstart.md` | Getting started, first integration, install instructions |
| `references/ingestion.md` | Uploading files/URLs/text, readiness polling, webhooks, bulk ingest |
| `references/retrieval.md` | Search options, `top_k`, reranking, hybrid search, filters |
| `references/mcp.md` | MCP server setup, `retrieve` tool, URL pattern, multi-partition config |
| `references/partitions.md` | Multi-tenancy, partition isolation, partition management |
| `references/metadata-filtering.md` | Tagging documents, filtering at retrieval time |
| `references/rag-patterns.md` | Building RAG responses, streaming, citations, tool use, production checklist |
| `references/api-reference.md` | Full REST endpoint reference, error codes, SDK auth |
| `references/python.md` | Python SDK equivalents for all patterns |

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Document** | Any ingested file, URL, or raw text. Processed asynchronously. |
| **Chunk** | A segment produced by Ragie's splitting pipeline. The unit of retrieval. |
| **Retrieval** | Hybrid semantic + keyword search across chunks. Returns `scored_chunks`. |
| **Partition** | Logical namespace for isolation (multi-tenancy, environments). |
| **Metadata** | Key-value pairs on documents; used for filtering at retrieval time. |

## Quick Decision Guide

- **New to Ragie?** → `references/quickstart.md`
- **Uploading documents?** → `references/ingestion.md`
- **Searching / querying?** → `references/retrieval.md`
- **Using Claude Code's MCP tool?** → `references/mcp.md`
- **Building a RAG app end-to-end?** → `references/rag-patterns.md`
- **Multiple tenants or environments?** → `references/partitions.md`
