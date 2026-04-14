# @ragieai/skills

Ragie skills for AI coding agents. Install once and your agent understands how to ingest documents, run retrievals, build RAG pipelines, configure the MCP server, and handle multi-tenancy with Ragie.

Works with Claude Code, Cursor, Cline, Copilot, Windsurf, and [40+ other agents](https://skills.sh).

## Installation

### Via skills CLI (recommended)

Installs into your current project for whichever agent you use:

```bash
npx skills add ragieai/skills
```

### Via npm

For programmatic access to skill and reference content:

```bash
npm install @ragieai/skills
```

### Local development

Symlink the skill directory directly into Claude Code's skills folder so edits are reflected immediately:

```bash
ln -s /path/to/ragieai/skills/skills/ragie ~/.claude/skills/ragie
```

## What's Included

### Skill

One skill — `ragie` — that activates when you ask about integrating Ragie, building RAG pipelines, ingesting documents, configuring the MCP server, or working with retrievals.

### References

| File | Content |
|------|---------|
| `quickstart.md` | Install SDK, ingest a document, run first retrieval |
| `ingestion.md` | Files, URLs, raw text, readiness polling, webhooks, bulk ingest |
| `retrieval.md` | Search options, `topK`, reranking, hybrid search, metadata filters |
| `mcp.md` | MCP server URL pattern, configuration, the `retrieve` tool |
| `partitions.md` | Multi-tenancy, partition isolation, partition management |
| `metadata-filtering.md` | Tagging documents, filtering at retrieval time |
| `rag-patterns.md` | RAG responses, streaming, citations, tool use, production checklist |
| `api-reference.md` | Full REST endpoint reference, error codes |
| `python.md` | Python SDK equivalents for all patterns |

References are loaded on demand — only what's relevant to the current task is pulled into context.

## MCP Server

The Ragie MCP server exposes a `retrieve` tool scoped to a partition, letting your agent search your knowledge base directly. Configure it with two environment variables:

```bash
export RAGIE_API_KEY=ragie_...
export RAGIE_PARTITION=your-partition
```

The plugin's `.mcp.json` handles the rest. See `mcp.md` for multi-partition setup.

## Programmatic API

```typescript
import {
  getSkill,
  getReference,
  getSkillPath,
  getReferencePath,
  getSkillsDir,
} from "@ragieai/skills";

// Get skill or reference content as a string
const skill = getSkill("ragie");
const quickstart = getReference("quickstart");

// Get absolute file paths
const skillPath = getSkillPath("ragie");
const refPath = getReferencePath("rag-patterns");
```

## License

MIT
