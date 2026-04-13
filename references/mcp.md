# Ragie MCP Server

The Ragie MCP server exposes a `retrieve` tool scoped to a specific partition. Use it to search your knowledge base interactively from Claude Code — without writing code.

## URL Pattern

Each partition gets its own endpoint:

```
https://api.ragie.ai/mcp/{partition}
```

Examples:
- `https://api.ragie.ai/mcp/debug` → `debug` partition
- `https://api.ragie.ai/mcp/production` → `production` partition

## Configuration

### Via this plugin (recommended)

Set environment variables before starting Claude Code:

```bash
export RAGIE_API_KEY=ragie_...
export RAGIE_PARTITION=your-partition-name
```

The plugin's `.mcp.json` handles the rest automatically.

### Manual project config

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "ragie": {
      "type": "http",
      "url": "https://api.ragie.ai/mcp/your-partition",
      "headers": {
        "Authorization": "Bearer ${RAGIE_API_KEY}"
      }
    }
  }
}
```

### Multiple partitions

```json
{
  "mcpServers": {
    "ragie-main": {
      "type": "http",
      "url": "https://api.ragie.ai/mcp/main",
      "headers": { "Authorization": "Bearer ${RAGIE_API_KEY}" }
    },
    "ragie-debug": {
      "type": "http",
      "url": "https://api.ragie.ai/mcp/debug",
      "headers": { "Authorization": "Bearer ${RAGIE_API_KEY}" }
    }
  }
}
```

## The `retrieve` Tool

Once the MCP server is connected, Claude can call `retrieve` directly.

Example prompts:
- *"Search my Ragie knowledge base for rate limit documentation"*
- *"What does Ragie have indexed about authentication?"*
- *"Retrieve the top 5 chunks about error handling and show me the scores"*

## When to Use MCP vs SDK

| Situation | Use |
|-----------|-----|
| Testing retrieval quality during development | MCP |
| Exploring what's indexed in a partition | MCP |
| Debugging poor search results | MCP |
| Production application code | SDK (`client.retrievals.retrieve()`) |
| Ingesting documents | SDK (MCP only exposes `retrieve`) |
