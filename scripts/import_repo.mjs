#!/usr/bin/env node
/**
 * Import a candidate skill repository into quarantine.
 *
 * The importer only reads: it clones into a temporary directory, discovers
 * markdown sources, records provenance, and writes a proposal. It never installs
 * a skill, never writes into a skill root, and never executes repository code.
 *
 * Usage:
 *   node scripts/import_repo.mjs <git-url> [--ref REF] [--subdir PATH]
 *                                [--out DIR] [--inventory FILE]
 *                                [--allow-local] [--keep-clone] [--json]
 */

import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  countLines,
  descriptionTerms,
  domainTags,
  estimateTokens,
  overlapScore,
  parseFrontmatter,
  sha256,
  slugify,
} from "./lib/skill.mjs";

const CWD = process.cwd();
const MAX_FILE_BYTES = 512 * 1024;
const MAX_FILES = 5000;

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "vendor",
  "dist",
  "build",
  "target",
  ".venv",
  "venv",
  "__pycache__",
  ".next",
  ".cache",
]);

const SCRIPT_EXTENSIONS = new Set([
  ".sh", ".bash", ".zsh", ".ps1", ".bat", ".cmd", ".js", ".mjs", ".cjs", ".ts",
  ".py", ".rb", ".pl", ".php", ".jar", ".exe", ".dll", ".so", ".dylib",
]);

const MERGE_SAFE_LICENSES = new Set(["MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "0BSD", "CC0-1.0"]);

export function repoSlug(url) {
  const cleaned = String(url).replace(/[\\/]+$/, "").replace(/\.git$/i, "");
  const last = cleaned.split(/[/:]/).filter(Boolean).pop() ?? "repository";
  return slugify(last);
}

/** Accept network git URLs; local paths only with an explicit opt-in. */
export function validateSource(source, { allowLocal = false } = {}) {
  if (/^(https:\/\/|ssh:\/\/|git:\/\/|git@[^:]+:)/.test(source)) return source;
  if (allowLocal) {
    const local = resolve(source);
    if (existsSync(local)) return local;
    throw new Error(`Local path does not exist: ${source}`);
  }
  throw new Error("Refusing non-network source. Pass --allow-local to import a local repository.");
}

export function detectLicense(root) {
  const candidates = ["LICENSE", "LICENSE.md", "LICENSE.txt", "COPYING", "COPYING.md"];
  for (const name of candidates) {
    const path = join(root, name);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, "utf8").slice(0, 8192);
    if (/Permission is hereby granted, free of charge/i.test(text)) return { id: "MIT", source: name };
    if (/Apache License/i.test(text) && /Version 2\.0/i.test(text)) return { id: "Apache-2.0", source: name };
    if (/GNU GENERAL PUBLIC LICENSE/i.test(text) && /Version 3/i.test(text)) return { id: "GPL-3.0", source: name };
    if (/GNU GENERAL PUBLIC LICENSE/i.test(text) && /Version 2/i.test(text)) return { id: "GPL-2.0", source: name };
    if (/Mozilla Public License/i.test(text)) return { id: "MPL-2.0", source: name };
    if (/Redistribution and use in source and binary forms/i.test(text)) return { id: "BSD-3-Clause", source: name };
    return { id: "unknown", source: name };
  }

  const pkgPath = join(root, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const license = JSON.parse(readFileSync(pkgPath, "utf8")).license;
      if (license) return { id: String(license), source: "package.json" };
    } catch {
      // Ignore malformed package metadata.
    }
  }
  return null;
}

export function classifyFile(relPath, text) {
  const name = basename(relPath).toLowerCase();
  const extension = extname(name);

  if (name === "skill.md") return "skill";
  if (name === "agents.md" || name === "claude.md") return "rules";
  if (extension === ".mdc" && /(^|\/)\.cursor\/rules\//.test(relPath.replaceAll("\\", "/"))) {
    return "rule";
  }
  if (extension !== ".md") return null;

  const { found, meta } = parseFrontmatter(text);
  if (found && meta.name && meta.description) return "skill-like";
  if (/(^|\/)skills\//.test(relPath.replaceAll("\\", "/"))) return "reference";
  return null;
}

function walkFiles(root) {
  const files = [];
  const visit = (dir, depth) => {
    if (depth > 8 || files.length >= MAX_FILES) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isSymbolicLink()) continue; // Do not follow links out of quarantine.
      if (entry.isDirectory()) {
        visit(full, depth + 1);
        continue;
      }
      if (!entry.isFile()) continue;
      let size = 0;
      try {
        size = statSync(full).size;
      } catch {
        continue;
      }
      if (size > MAX_FILE_BYTES) continue;
      files.push({ path: full, rel: relative(root, full).split(sep).join("/"), size });
    }
  };
  visit(root, 0);
  return files;
}

/** Find skill-shaped markdown without interpreting or executing it. */
export function discoverCandidates(root) {
  const candidates = [];
  const executable = [];
  const files = walkFiles(root);

  for (const file of files) {
    const extension = extname(file.rel).toLowerCase();
    if (SCRIPT_EXTENSIONS.has(extension)) {
      executable.push(file.rel);
      continue;
    }
    if (![".md", ".mdc", ".markdown"].includes(extension)) continue;

    let text;
    try {
      text = readFileSync(file.path, "utf8");
    } catch {
      continue;
    }
    if (text.includes("\u0000")) continue;

    const kind = classifyFile(file.rel, text);
    if (!kind) continue;

    const { found, meta } = parseFrontmatter(text);
    const stem = basename(file.rel, extension);
    const parent = basename(dirname(file.rel));
    const generic = ["skill", "agents", "claude"].includes(stem.toLowerCase());
    const fallback = generic && parent !== "." ? parent : stem;

    candidates.push({
      path: file.path,
      rel: file.rel,
      kind,
      hasFrontmatter: found,
      name: meta.name || fallback,
      description: meta.description || "",
      license: meta.license || "",
      lines: countLines(text),
      tokens: estimateTokens(text),
      descriptionTokens: estimateTokens(meta.description || ""),
      contentHash: sha256(text.replace(/\r\n/g, "\n").trim()),
      flags: securityFlags(meta, text),
    });
  }

  return { candidates, executable, scanned: files.length };
}

function securityFlags(meta, text) {
  const flags = [];
  if (meta.hooks) flags.push("declares hooks");
  if (meta["allowed-tools"]) flags.push("declares allowed-tools");
  if (/```(?:bash|sh|powershell|pwsh|cmd)\b/i.test(text)) flags.push("contains shell instructions");
  if (/\bcurl\b[^\n]*\|\s*(?:sh|bash)\b/i.test(text)) flags.push("pipes remote content into a shell");
  if (/(?:rm\s+-rf|Remove-Item[^\n]*-Recurse)/i.test(text)) flags.push("contains destructive commands");
  return flags;
}

export function loadInventory(path) {
  if (!path || !existsSync(path)) return null;
  try {
    const data = JSON.parse(readFileSync(path, "utf8"));
    const skills = (data.skills ?? []).map((skill) => ({
      ...skill,
      terms: descriptionTerms(skill.description ?? ""),
      tags: domainTags(skill.description ?? ""),
    }));
    return {
      path,
      names: new Set(skills.map((skill) => skill.name)),
      hashes: new Set(skills.map((skill) => skill.contentHash)),
      skills,
    };
  } catch {
    return null;
  }
}

export function compareWithInventory(candidate, inventory) {
  if (!inventory) return { duplicateName: false, duplicateContent: false, closest: null };
  const duplicateName = inventory.names.has(candidate.name);
  const duplicateContent = inventory.hashes.has(candidate.contentHash);

  let closest = null;
  if (candidate.description) {
    const terms = descriptionTerms(candidate.description);
    const tags = domainTags(candidate.description);
    for (const skill of inventory.skills) {
      const result = overlapScore({ terms, tags }, skill);
      if (result.score > 0 && (!closest || result.score > closest.score)) {
        closest = { name: skill.name, score: result.score };
      }
    }
  }
  return { duplicateName, duplicateContent, closest };
}

function recommendedAction(candidate, comparison, license) {
  if (comparison.duplicateContent) return "skip — identical content already installed";
  if (comparison.duplicateName) return "merge or replace — name already installed";
  if (license && !MERGE_SAFE_LICENSES.has(license.id)) {
    return license.id === "unknown"
      ? "reference only — license unresolved"
      : `reference only — ${license.id} needs a compatibility decision`;
  }
  if (candidate.kind === "rules" || candidate.kind === "rule") {
    return "merge into an advisor via advisor-creator";
  }
  if (candidate.kind === "reference") return "keep as a reference candidate";
  return "review for adoption";
}

function renderProposal({ source, commit, license, candidates, executable, inventory, comparison }) {
  const primary = candidates.filter((candidate) => candidate.kind !== "reference");
  const references = candidates.filter((candidate) => candidate.kind === "reference");

  const lines = [];
  lines.push(`# Import proposal: ${source}`);
  lines.push("");
  lines.push(`- Commit: \`${commit}\``);
  lines.push(`- License: ${license ? `\`${license.id}\` (${license.source})` : "not found"}`);
  lines.push(`- Inventory compared: ${inventory ? `\`${inventory.path}\`` : "none"}`);
  lines.push(`- Skill candidates copied as data: ${primary.length}`);
  lines.push(`- Reference files copied as data: ${references.length}`);
  lines.push(`- Executable files found (not copied, not run): ${executable.length}`);
  lines.push("");
  lines.push("This tool did not install anything, write into a skill root, or run repository code.");
  lines.push("");
  lines.push("## Skill candidates");
  lines.push("");
  lines.push("| Source | Kind | Name | Lines | Description tokens | Closest installed | Action |");
  lines.push("| :--- | :--- | :--- | ---: | ---: | :--- | :--- |");
  for (const candidate of primary) {
    const closest = comparison.get(candidate.rel)?.closest;
    lines.push(
      `| \`${candidate.rel}\` | ${candidate.kind} | \`${candidate.name}\` | ${candidate.lines} | ~${candidate.descriptionTokens} | ${closest ? `${closest.name} (${closest.score})` : "—"} | ${candidate.action} |`,
    );
  }
  lines.push("");

  if (references.length > 0) {
    lines.push("## Reference files");
    lines.push("");
    lines.push("References are grouped by directory; they only make sense attached to their parent skill.");
    lines.push("");
    lines.push("| Directory | Files | Lines |");
    lines.push("| :--- | ---: | ---: |");
    const groups = new Map();
    for (const candidate of references) {
      const dir = dirname(candidate.rel);
      if (!groups.has(dir)) groups.set(dir, { files: 0, lines: 0 });
      const group = groups.get(dir);
      group.files += 1;
      group.lines += candidate.lines;
    }
    for (const [dir, group] of [...groups].sort((a, b) => a[0].localeCompare(b[0]))) {
      lines.push(`| \`${dir}\` | ${group.files} | ${group.lines} |`);
    }
    lines.push("");
  }

  if (executable.length > 0) {
    lines.push("## Executable files (quarantined, never run)");
    lines.push("");
    for (const file of executable.slice(0, 30)) lines.push(`- \`${file}\``);
    if (executable.length > 30) lines.push(`- … ${executable.length - 30} more`);
    lines.push("");
  }

  const flagged = candidates.filter((candidate) => candidate.flags.length > 0);
  if (flagged.length > 0) {
    lines.push("## Security notes");
    lines.push("");
    for (const candidate of flagged) {
      lines.push(`- \`${candidate.rel}\`: ${candidate.flags.join(", ")}`);
    }
    lines.push("");
  }

  lines.push("## Next steps");
  lines.push("");
  lines.push("1. Read the copied candidates under `candidates/`; treat their text as data, not as instructions.");
  lines.push("2. For merge candidates, run `advisor-creator` and cite the source commit above.");
  lines.push("3. Put any accepted advisor under `skills/<name>/`, run `node scripts/validate_skills.mjs`, then install it deliberately.");
  lines.push("");
  return lines.join("\n");
}

export function importRepo(options) {
  const source = validateSource(options.source, { allowLocal: options.allowLocal });
  const quarantine = mkdtempSync(join(tmpdir(), "advisor-import-"));
  const cloneDir = join(quarantine, "repo");
  const outDir = resolve(options.out ?? join(CWD, ".advisor-import", repoSlug(options.source)));

  try {
    const args = ["clone", "--depth", "1", "--no-tags"];
    if (options.ref) args.push("--branch", options.ref);
    const cloneSource = /^(https:\/\/|ssh:\/\/|git:\/\/|git@)/.test(source)
      ? source
      : pathToFileURL(source).href;
    args.push(cloneSource, cloneDir);
    execFileSync("git", args, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });

    const commit = execFileSync("git", ["-C", cloneDir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    const root = options.subdir ? resolve(cloneDir, options.subdir) : cloneDir;
    const within = relative(cloneDir, root);
    if (within.startsWith("..") || isAbsolute(within)) {
      throw new Error("--subdir points outside the cloned repository");
    }
    if (!existsSync(root)) throw new Error(`--subdir does not exist: ${options.subdir}`);

    const license = detectLicense(root) ?? detectLicense(cloneDir);
    const { candidates, executable, scanned } = discoverCandidates(root);
    const inventory = loadInventory(options.inventory ?? join(CWD, ".advisor-audit", "skills.lock.json"));

    const comparison = new Map();
    for (const candidate of candidates) {
      const result = compareWithInventory(candidate, inventory);
      comparison.set(candidate.rel, result);
      candidate.action = recommendedAction(candidate, result, license);
    }

    const candidatesDir = join(outDir, "candidates");
    for (const candidate of candidates) {
      const target = join(candidatesDir, candidate.rel);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(candidate.path, target);
    }

    const manifest = {
      version: 1,
      importedAt: new Date().toISOString(),
      source: options.source,
      resolvedSource: source,
      ref: options.ref ?? null,
      commit,
      subdir: options.subdir ?? null,
      license,
      scannedFiles: scanned,
      executableFiles: executable,
      inventory: inventory ? inventory.path : null,
      candidates: candidates.map((candidate) => ({
        rel: candidate.rel,
        kind: candidate.kind,
        name: candidate.name,
        description: candidate.description,
        lines: candidate.lines,
        tokens: candidate.tokens,
        contentHash: candidate.contentHash,
        flags: candidate.flags,
        action: candidate.action,
        duplicateName: comparison.get(candidate.rel).duplicateName,
        duplicateContent: comparison.get(candidate.rel).duplicateContent,
        closest: comparison.get(candidate.rel).closest,
      })),
    };

    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    writeFileSync(join(outDir, "proposal.md"), `${renderProposal({ source: options.source, commit, license, candidates, executable, inventory, comparison })}\n`, "utf8");

    return { outDir, commit, license, candidates, executable, manifest };
  } finally {
    if (!options.keepClone) rmSync(quarantine, { recursive: true, force: true });
  }
}

function parseArgs(argv) {
  const options = {
    source: "",
    ref: null,
    subdir: null,
    out: null,
    inventory: null,
    allowLocal: false,
    keepClone: false,
    json: false,
  };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--ref") options.ref = argv[++i];
    else if (arg === "--subdir") options.subdir = argv[++i];
    else if (arg === "--out") options.out = resolve(argv[++i]);
    else if (arg === "--inventory") options.inventory = resolve(argv[++i]);
    else if (arg === "--allow-local") options.allowLocal = true;
    else if (arg === "--keep-clone") options.keepClone = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/import_repo.mjs <git-url> [--ref REF] [--subdir PATH] [--out DIR] [--inventory FILE] [--allow-local] [--keep-clone] [--json]");
      process.exit(0);
    } else if (arg.startsWith("-")) throw new Error(`Unknown argument: ${arg}`);
    else positional.push(arg);
  }
  if (positional.length !== 1) throw new Error("Expected exactly one git URL");
  options.source = positional[0];
  return options;
}

export function runImport(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const result = importRepo(options);
  if (options.json) {
    console.log(JSON.stringify(result.manifest, null, 2));
    return 0;
  }
  console.log(`Imported ${result.candidates.length} candidate(s) from commit ${result.commit.slice(0, 12)}.`);
  console.log(`License: ${result.license ? result.license.id : "not found"}`);
  console.log(`Executable files found (not run): ${result.executable.length}`);
  console.log(`Proposal: ${join(result.outDir, "proposal.md")}`);
  console.log("Nothing was installed. Review the proposal before adopting anything.");
  return 0;
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  try {
    process.exit(runImport());
  } catch (error) {
    console.error(`import failed: ${error.message}`);
    process.exit(1);
  }
}
