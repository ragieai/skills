# RAG Patterns with Ragie

> Python user? See `references/python.md` for Python equivalents.

## Basic RAG Response

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { Ragie } from "ragie";

const ragie = new Ragie({ auth: process.env.RAGIE_API_KEY });
const anthropic = new Anthropic();

async function answer(question: string): Promise<string> {
  const results = await ragie.retrievals.retrieve({
    query: question,
    rerank: true,
    topK: 6,
  });
  const context = results.scoredChunks.map((c) => c.text).join("\n\n");

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` }],
  });
  return (msg.content[0] as { text: string }).text;
}
```

## Streaming

```typescript
async function streamAnswer(question: string): Promise<void> {
  const results = await ragie.retrievals.retrieve({
    query: question,
    rerank: true,
    topK: 6,
  });
  const context = results.scoredChunks.map((c) => c.text).join("\n\n");

  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` }],
  });
  for await (const chunk of stream) {
    if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
      process.stdout.write(chunk.delta.text);
    }
  }
}
```

## Citations

```typescript
async function answerWithCitations(question: string) {
  const results = await ragie.retrievals.retrieve({
    query: question,
    rerank: true,
    topK: 6,
  });

  const sources = results.scoredChunks.map((c) => ({
    name: c.documentName,
    id: c.documentId,
  }));
  const context = results.scoredChunks
    .map((c) => `[Source: ${c.documentName}]\n${c.text}`)
    .join("\n\n");

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Answer using only the context below. Reference sources by name.\n\nContext:\n${context}\n\nQuestion: ${question}`,
    }],
  });

  return { answer: (msg.content[0] as { text: string }).text, sources };
}
```

## Tool Use Integration

Expose Ragie as a tool Claude can call during an agentic loop:

```typescript
const tools: Anthropic.Tool[] = [{
  name: "search_knowledge_base",
  description: "Search the internal knowledge base for relevant information.",
  input_schema: {
    type: "object",
    properties: { query: { type: "string", description: "The search query" } },
    required: ["query"],
  },
}];

async function runAgent(userMessage: string): Promise<string> {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userMessage }];

  while (true) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      tools,
      messages,
    });

    if (response.stop_reason === "tool_use") {
      const toolUse = response.content.find((b) => b.type === "tool_use") as Anthropic.ToolUseBlock;
      const { query } = toolUse.input as { query: string };
      const results = await ragie.retrievals.retrieve({ query, rerank: true });
      const context = results.scoredChunks.map((c) => c.text).join("\n\n");

      messages.push(
        { role: "assistant", content: response.content },
        { role: "user", content: [{ type: "tool_result", tool_use_id: toolUse.id, content: context }] }
      );
    } else {
      const text = response.content.find((b) => b.type === "text") as Anthropic.TextBlock;
      return text.text;
    }
  }
}
```

## Multi-Tenant RAG

```typescript
async function answerForTenant(tenantId: string, question: string): Promise<string> {
  const results = await ragie.retrievals.retrieve({
    query: question,
    partition: `tenant-${tenantId}`,
    rerank: true,
  });
  const context = results.scoredChunks.map((c) => c.text).join("\n\n");

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` }],
  });
  return (msg.content[0] as { text: string }).text;
}
```

## Production Checklist

- [ ] API key in environment variable, not source code
- [ ] `rerank: true` for generation use cases
- [ ] Document readiness verified before querying (polling or webhook)
- [ ] Partitions used for multi-tenant isolation
- [ ] Metadata attached for future filtering
- [ ] Retry on 429 / 5xx with exponential back-off
- [ ] Citations surfaced in answers
- [ ] `topK` tuned to use case (6–10 is typical)
- [ ] Chunk scores logged for retrieval quality monitoring
