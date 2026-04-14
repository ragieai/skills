import { existsSync } from "fs";
import { describe, expect, it } from "vitest";
import {
  getReference,
  getReferencePath,
  getSkill,
  getSkillPath,
  getSkillsDir,
} from "./index";

describe("getReferencePath", () => {
  it("returns a path that exists for each reference", () => {
    const names = [
      "quickstart",
      "ingestion",
      "retrieval",
      "mcp",
      "partitions",
      "metadata-filtering",
      "rag-patterns",
      "api-reference",
      "python",
    ] as const;

    for (const name of names) {
      const path = getReferencePath(name);
      expect(existsSync(path), `missing reference: ${name}`).toBe(true);
    }
  });
});

describe("getReference", () => {
  it("returns non-empty content", () => {
    const content = getReference("quickstart");
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain("Ragie");
  });
});

describe("getSkillPath", () => {
  it("returns a path that exists", () => {
    expect(existsSync(getSkillPath("ragie"))).toBe(true);
  });
});

describe("getSkill", () => {
  it("returns non-empty content", () => {
    const content = getSkill("ragie");
    expect(content.length).toBeGreaterThan(0);
  });
});

describe("getSkillsDir", () => {
  it("returns a directory that exists", () => {
    expect(existsSync(getSkillsDir())).toBe(true);
  });
});
