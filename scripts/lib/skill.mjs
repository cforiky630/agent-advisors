/**
 * Shared helpers for reading and comparing agent skills.
 *
 * Everything here works on plain text and filesystem paths; nothing loads a
 * skill or executes anything it contains.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
const CJK = /[㐀-鿿豈-﫿぀-ヿ가-힯]/g;

const STOPWORDS = new Set(
  `a an and any are as at be been being by can could do does for from has have how if in into is it its may might must not of on or should so than that the their them then there these they this those to use used user users using via was were what when where which while who will with without you your whenever even all`.split(
    /\s+/,
  ),
);

const DOMAIN_TAGS = [
  ["review", /\b(review|audit|inspection|checklist)\b/i],
  ["refactor", /\b(refactor|code smell|technical debt|legacy|moderni[sz]e)\b/i],
  ["testing", /\b(test|tdd|coverage|fixture|assert|regression)\b/i],
  ["debugging", /\b(debug|diagnos|bug|flaky|stack trace)\b/i],
  ["architecture", /\b(architect|module|interface|abstraction|layering|dependency|deep module)\b/i],
  ["domain-modeling", /\b(domain|ddd|aggregate|entity|value object|bounded context)\b/i],
  ["frontend", /\b(frontend|ui|ux|react|css|html|component|design system)\b/i],
  ["docs", /\b(document|docs|readme|spec|writing|proposal|memo)\b/i],
  ["deliverables", /\b(slide|deck|presentation|pptx|docx|xlsx|pdf|spreadsheet|poster|artifact)\b/i],
  ["security", /\b(security|vulnerab|threat model|owasp|authentication|authorization|cve)\b/i],
  ["data", /\b(sql|database|schema|etl|analytics|pipeline|storage)\b/i],
  ["ops", /\b(deploy|ci|cd|kubernetes|docker|incident|sre|monitor|release)\b/i],
  ["research", /\b(research|investigat|sources|evidence|citation)\b/i],
  ["planning", /\b(plan|ticket|backlog|roadmap|estimate|breakdown)\b/i],
];

const SCRIPT_EXTENSIONS = new Set([
  ".sh",
  ".bash",
  ".zsh",
  ".ps1",
  ".bat",
  ".cmd",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".py",
  ".rb",
  ".pl",
  ".php",
  ".jar",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
]);

export const OVERBROAD_PATTERNS = [
  [/\bwhenever\b/i, "whenever"],
  [/\beven when\b/i, "even when"],
  [/\bany (?:task|request|code|project)\b/i, "any task/request"],
  [/\ball (?:tasks|requests|code)\b/i, "all tasks"],
  [/\banything\b/i, "anything"],
];

/** Parse leading YAML-ish frontmatter without a YAML dependency. */
export function parseFrontmatter(text) {
  const source = String(text ?? "").replace(/^﻿/, "");
  const match = source.match(FRONTMATTER);
  if (!match) return { found: false, meta: {}, body: source };
  const meta = {};
  for (const raw of match[1].split(/\r?\n/)) {
    if (!raw.trim() || raw.trimStart().startsWith("#") || /^[ \t]/.test(raw)) continue;
    const colon = raw.indexOf(":");
    if (colon <= 0) continue;
    const key = raw.slice(0, colon).trim();
    let value = raw.slice(colon + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    meta[key] = value;
  }
  return { found: true, meta, body: source.slice(match[0].length) };
}

export function countLines(text) {
  const normalized = String(text ?? "").replace(/\r\n/g, "\n").replace(/\n$/, "");
  return normalized ? normalized.split("\n").length : 0;
}

/** Rough token estimate: CJK characters count as one, other text as chars/4. */
export function estimateTokens(text) {
  const value = String(text ?? "");
  const cjk = value.match(CJK)?.length ?? 0;
  const rest = value.replace(CJK, "").length;
  return cjk + Math.ceil(rest / 4);
}

export function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function descriptionTerms(description) {
  return new Set(
    String(description ?? "")
      .toLowerCase()
      .replace(/[`*_#>/\\()[\]{},.:;!?'"]/g, " ")
      .split(/\s+/)
      .map((word) => word.replace(/^[-+]+|[-+]+$/g, ""))
      .filter((word) => word.length >= 3 && !STOPWORDS.has(word))
      .map((word) => (word.length > 4 && word.endsWith("s") ? word.slice(0, -1) : word))
      .filter((word) => word.length >= 3),
  );
}

export function domainTags(text) {
  const tags = new Set();
  for (const [tag, pattern] of DOMAIN_TAGS) {
    if (pattern.test(String(text ?? ""))) tags.add(tag);
  }
  return tags;
}

function dice(a, b) {
  const total = a.size + b.size;
  if (total === 0) return 0;
  let shared = 0;
  for (const item of a) if (b.has(item)) shared += 1;
  return (2 * shared) / total;
}

function jaccard(a, b) {
  const union = new Set([...a, ...b]).size;
  if (union === 0) return 0;
  let shared = 0;
  for (const item of a) if (b.has(item)) shared += 1;
  return shared / union;
}

/** Compare two skills' trigger surfaces. Returns a score in [0, 1]. */
export function overlapScore(a, b) {
  const sharedTerms = [...a.terms].filter((term) => b.terms.has(term));
  const sharedTags = [...a.tags].filter((tag) => b.tags.has(tag));
  return {
    score: Number((0.6 * dice(a.terms, b.terms) + 0.4 * jaccard(a.tags, b.tags)).toFixed(3)),
    sharedTerms: sharedTerms.slice(0, 8),
    sharedTags,
  };
}

export function findOverbroad(description) {
  const hits = [];
  for (const [pattern, label] of OVERBROAD_PATTERNS) {
    if (pattern.test(description)) hits.push(label);
  }
  if (estimateTokens(description) > 180) hits.push("very long description");
  return hits;
}

/** Collect files in a skill directory that would run outside the model. */
export function findExecutableSurface(skillDir) {
  const found = [];
  const walk = (dir, depth) => {
    if (depth > 4) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === "references" || entry.name === ".git" || entry.name === "node_modules") continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, depth + 1);
        continue;
      }
      let isFile = entry.isFile();
      if (entry.isSymbolicLink()) {
        try {
          isFile = statSync(full).isFile();
        } catch {
          isFile = false;
        }
      }
      if (isFile) {
        const extension = entry.name.slice(entry.name.lastIndexOf(".")).toLowerCase();
        if (SCRIPT_EXTENSIONS.has(extension)) {
          found.push(relative(skillDir, full).split(sep).join("/"));
        }
      }
    }
  };
  walk(skillDir, 0);
  return found;
}

/** Read a skill directory into a comparable record. */
export function readSkill(skillDir, { scope = "unknown", agent = "unknown" } = {}) {
  const skillMd = join(skillDir, "SKILL.md");
  const text = readFileSync(skillMd, "utf8");
  const { found, meta, body } = parseFrontmatter(text);
  const name = meta.name || basename(skillDir);
  const description = meta.description || "";

  const referencesDir = join(skillDir, "references");
  const referenceFiles = existsSync(referencesDir)
    ? readdirSync(referencesDir).filter((file) => file.endsWith(".md")).sort()
    : [];
  const unlinkedReferences = referenceFiles.filter((file) => !body.includes(file));
  const missingReferences = [
    ...new Set(
      [...body.matchAll(/references\/([A-Za-z0-9._/-]+\.md)/g)]
        .map((match) => match[1])
        .filter((file) => !existsSync(join(referencesDir, file))),
    ),
  ];

  return {
    name,
    skillDir,
    skillMd,
    scope,
    agent,
    frontmatter: found,
    description,
    descriptionChars: description.length,
    descriptionTokens: estimateTokens(description),
    lineCount: countLines(text),
    hash: sha256(text),
    license: meta.license ?? "",
    references: referenceFiles,
    unlinkedReferences,
    missingReferences,
    executableFiles: findExecutableSurface(skillDir),
    terms: descriptionTerms(description),
    tags: domainTags(description),
    overbroad: findOverbroad(description),
    contentHash: sha256(text.replace(/\r\n/g, "\n").trim()),
  };
}

/**
 * Validate a skill record.
 *
 * strict is for this repository's own authoring rules. Installed third-party
 * skills are only held to correctness (readable frontmatter, resolvable
 * references); stylistic budgets are reported as notes instead.
 */
export function structuralIssues(record, { strict = false } = {}) {
  const issues = [];
  const add = (level, message) => issues.push({ level, message });
  const authoring = strict ? "warn" : "info";

  if (!record.frontmatter) add("error", "missing YAML frontmatter");
  if (!record.description) add("error", "frontmatter is missing 'description'");
  if (record.descriptionChars > 1200) {
    add(authoring, `description is ${record.descriptionChars} chars (max 1200)`);
  }
  if (record.lineCount > 150) add(authoring, `${record.lineCount} lines (max 150)`);
  if (record.unlinkedReferences.length > 0) {
    add("info", `unlinked references: ${record.unlinkedReferences.join(", ")}`);
  }
  if (record.missingReferences.length > 0) {
    add(strict ? "error" : "warn", `linked references do not exist: ${record.missingReferences.join(", ")}`);
  }
  if (record.executableFiles.length > 0) {
    add("info", `contains executable files: ${record.executableFiles.join(", ")}`);
  }
  if (record.overbroad.length > 0) {
    add("info", `broad trigger wording: ${record.overbroad.join(", ")}`);
  }
  return issues;
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "imported";
}
