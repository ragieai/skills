import { readFileSync } from "fs";
import { join } from "path";

const root = join(__dirname, "..");

const REFERENCES = [
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

const SKILLS = ["ragie"] as const;

export type ReferenceName = (typeof REFERENCES)[number];
export type SkillName = (typeof SKILLS)[number];

/** Returns the absolute path to a reference file. */
export function getReferencePath(name: ReferenceName): string {
  return join(root, "skills", "ragie", "references", `${name}.md`);
}

/** Returns the absolute path to a skill's SKILL.md. */
export function getSkillPath(name: SkillName): string {
  return join(root, "skills", name, "SKILL.md");
}

/** Returns the absolute path to the skills directory. */
export function getSkillsDir(): string {
  return join(root, "skills");
}

/** Returns the content of a reference file as a string. */
export function getReference(name: ReferenceName): string {
  return readFileSync(getReferencePath(name), "utf-8");
}

/** Returns the content of a skill's SKILL.md as a string. */
export function getSkill(name: SkillName): string {
  return readFileSync(getSkillPath(name), "utf-8");
}
