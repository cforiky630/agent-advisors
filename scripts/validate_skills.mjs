#!/usr/bin/env node
/**
 * Structural validator for this repository.
 *
 * Checks every skill's frontmatter, size, required sections, reference links,
 * and the relative links in the documentation. Standard library only, so it runs
 * unchanged in CI and on a contributor's machine.
 *
 * Usage:
 *   node scripts/validate_skills.mjs
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { countLines, parseFrontmatter, readSkill } from "./lib/skill.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(ROOT, "skills");
const MAX_SKILL_LINES = 150;
const MAX_DESCRIPTION_CHARS = 1200;

const REQUIRED_ADVISOR_SECTIONS = [
  "## 1. Scenario Decision Matrix",
  "## 2. Engineering Trade-offs",
  "## 3. Condensed Nano Rulesets",
  "## 4. Deep Knowledge Base",
  "## 5. Output Delivery Format",
];

// [pattern, explanation]. These encode defects this repository has already fixed,
// so they cannot quietly return through a copy-paste contribution.
const PROHIBITED = [
  [/#\s*OBEY\b/, "loaded imperative header"],
  [/\bread_file\b/, "tool-specific file reader name"],
  [/70\+\s+(?:OOP|Standard)/, "inflated pattern count"],
  [/\b90%\s+of\b/, "unsupported precision claim"],
  [/https:\/\/github\.com\)/, "placeholder link"],
  [/comprehensive treaties/, "misleading phrasing"],
  [/\b14 classics\b/, "catalog count inconsistent with the 8-domain framing"],
];

const SCANNED_DOCS = [
  "README.md",
  "README_ZH.md",
  "CONTRIBUTING.md",
  "docs/AUDIT.md",
  "docs/provenance/README.md",
  "docs/provenance/advisor-creator.md",
  "docs/provenance/api-security-advisor.md",
  "docs/provenance/data-storage-advisor.md",
  "docs/provenance/software-design-advisor.md",
  "evals/outcome-protocol.md",
  "evals/trigger-cases.md",
  "evals/api-security-trigger-cases.md",
  "evals/data-storage-trigger-cases.md",
];
const MARKDOWN_LINK = /\[[^\]]*\]\(([^)]+)\)/g;
const HTML_HREF = /href="([^"]+)"/g;

const errors = [];

const rel = (path) => relative(ROOT, path).split(sep).join("/");
const fail = (path, message) => errors.push(`${rel(path)}: ${message}`);
const read = (path) => readFileSync(path, "utf8");

function checkProhibited(path, text) {
  for (const [pattern, explanation] of PROHIBITED) {
    const match = pattern.exec(text);
    if (!match) continue;
    const line = text.slice(0, match.index).split("\n").length;
    fail(path, `line ${line}: prohibited pattern '${match[0]}' (${explanation})`);
  }
}

function checkSkill(skillMd) {
  const dirName = dirname(skillMd).split(sep).pop();
  const text = read(skillMd);
  const { found, meta, body } = parseFrontmatter(text);
  const record = readSkill(dirname(skillMd));

  if (!found) fail(skillMd, "missing YAML frontmatter");

  const name = meta.name ?? "";
  if (!name) {
    fail(skillMd, "frontmatter is missing 'name'");
  } else if (name !== dirName) {
    fail(skillMd, `name '${name}' does not match directory '${dirName}'`);
  } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    fail(skillMd, `name '${name}' is not kebab-case`);
  }

  const description = meta.description ?? "";
  if (!description) {
    fail(skillMd, "frontmatter is missing 'description'");
  } else if (description.length > MAX_DESCRIPTION_CHARS) {
    fail(skillMd, `description is ${description.length} chars (max ${MAX_DESCRIPTION_CHARS})`);
  }

  if (meta.license !== "MIT") fail(skillMd, "frontmatter must declare 'license: MIT'");

  const lines = countLines(text);
  if (lines > MAX_SKILL_LINES) fail(skillMd, `${lines} lines (max ${MAX_SKILL_LINES})`);

  if (dirName.endsWith("-advisor")) {
    for (const heading of REQUIRED_ADVISOR_SECTIONS) {
      if (!body.includes(heading)) fail(skillMd, `missing required section '${heading}'`);
    }
  }

  for (const file of record.unlinkedReferences) {
    fail(skillMd, `reference is never linked: references/${file}`);
  }
  for (const file of record.missingReferences) {
    fail(skillMd, `linked reference does not exist: ${file.includes("/") ? file : `references/${file}`}`);
  }
  if (record.overbroad.length > 0) {
    fail(skillMd, `broad trigger wording in description: ${record.overbroad.join(", ")}`);
  }

  checkProhibited(skillMd, text);
}

function checkDoc(docPath) {
  const text = read(docPath);
  const withoutCode = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`\n]+`/g, "");
  const targets = [...withoutCode.matchAll(MARKDOWN_LINK), ...withoutCode.matchAll(HTML_HREF)];
  for (const match of targets) {
    const target = match[1].trim().replace(/\s+(?:"[^"]*"|'[^']*')\s*$/, "").trim();
    if (!target || /^(#|https?:\/\/|mailto:)/.test(target)) continue;
    const local = target.split("#")[0];
    if (local && !existsSync(join(dirname(docPath), local))) {
      fail(docPath, `broken relative link: ${target}`);
    }
  }
  checkProhibited(docPath, text);
}

function main() {
  const skillFiles = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(SKILLS_DIR, entry.name, "SKILL.md"))
    .filter(existsSync)
    .sort();

  if (skillFiles.length === 0) fail(SKILLS_DIR, "no skills found");

  for (const skillMd of skillFiles) {
    checkSkill(skillMd);
    console.log(`checked ${rel(skillMd)}`);
  }

  for (const docName of SCANNED_DOCS) {
    const docPath = join(ROOT, docName);
    if (!existsSync(docPath)) {
      fail(ROOT, `missing ${docName}`);
      continue;
    }
    checkDoc(docPath);
    console.log(`checked ${docName}`);
  }

  if (errors.length > 0) {
    console.log(`\n${errors.length} problem(s) found:`);
    for (const error of errors) console.log(`  - ${error}`);
    return 1;
  }

  console.log("\nAll checks passed.");
  return 0;
}

process.exit(main());
