#!/usr/bin/env node
/**
 * Symlink / junction installer and universal AGENTS.md compiler for this repository.
 *
 * Links domain advisors from `skills/` into supported agent skill directories
 * without clobbering non-symlink user folders, or compiles a synchronized
 * Condensed Nano Ruleset bundle for runtimes without native multi-skill routing.
 *
 * Usage:
 *   node scripts/link_skills.mjs [--agent claude|claude-project|cursor|codex|gemini|cc-switch|all]
 *                                [--dir <path>]... [--skill <name>]...
 *                                [--include-meta] [--unlink] [--status]
 *                                [--force] [--dry-run] [--emit-agents <file>]
 *                                [--json] [--help]
 */

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { parseFrontmatter, readSkill } from "./lib/skill.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const DEFAULT_SKILLS_DIR = join(ROOT, "skills");

const toPosix = (value) => value.split(sep).join("/");

function safeLstat(targetPath) {
  try {
    return lstatSync(targetPath);
  } catch (error) {
    if (error && error.code === "ENOENT") return null;
    throw error;
  }
}

function safeRealpath(targetPath) {
  try {
    return realpathSync(targetPath);
  } catch {
    return null;
  }
}

/**
 * List skills in this repository's `skills/` directory.
 * By default returns only `*-advisor` domain advisors unless `includeMeta: true`
 * or explicit skill names are passed via `only`.
 */
export function listRepoSkills(
  skillsDir = DEFAULT_SKILLS_DIR,
  { includeMeta = false, only = [] } = {},
) {
  const resolvedDir = resolve(skillsDir);
  if (!existsSync(resolvedDir)) {
    throw new Error(`Skills directory does not exist: ${resolvedDir}`);
  }

  const requested = [...new Set(only.map((name) => String(name).trim()).filter(Boolean))];
  const records = readdirSync(resolvedDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(resolvedDir, entry.name, "SKILL.md")))
    .map((entry) => readSkill(join(resolvedDir, entry.name), { scope: "repo", agent: "repo" }))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (requested.length > 0) {
    const byName = new Map(records.map((record) => [record.name, record]));
    for (const name of requested) {
      if (!byName.has(name)) {
        throw new Error(`Unknown skill '${name}' in ${resolvedDir}`);
      }
    }
    const requestedSet = new Set(requested);
    return records.filter((record) => requestedSet.has(record.name));
  }

  if (includeMeta) return records;
  return records.filter((record) => record.name.endsWith("-advisor"));
}

const ALL_DEFAULT_AGENTS = [
  "claude-user",
  "claude-project",
  "cursor-project",
  "codex",
  "gemini",
  "cc-switch",
];

function mapAgentRoot(agentName, { home, cwd }) {
  switch (agentName) {
    case "claude":
    case "claude-user":
      return { agent: "claude", scope: "claude-user", path: join(home, ".claude", "skills") };
    case "claude-project":
      return { agent: "claude-project", scope: "claude-project", path: join(cwd, ".claude", "skills") };
    case "cursor":
    case "cursor-project":
      return { agent: "cursor", scope: "cursor-project", path: join(cwd, ".cursor", "skills") };
    case "codex":
      return { agent: "codex", scope: "codex", path: join(home, ".codex", "skills") };
    case "gemini":
    case "antigravity":
      return { agent: "gemini", scope: "gemini", path: join(home, ".gemini", "skills") };
    case "cc-switch":
      return { agent: "cc-switch", scope: "cc-switch", path: join(home, ".cc-switch", "skills") };
    default:
      throw new Error(`Unknown agent target: ${agentName}`);
  }
}

/**
 * Resolve agent names and custom directories into concrete target root records.
 */
export function resolveTargetRoots({
  agents = [],
  customDirs = [],
  home = homedir(),
  cwd = process.cwd(),
  mode = "link",
} = {}) {
  const normalizedAgents = agents
    .flatMap((item) => String(item).split(","))
    .map((item) => item.trim())
    .filter(Boolean);
  const normalizedCustom = customDirs
    .map((dir) => String(dir).trim())
    .filter(Boolean);

  let effectiveAgents = normalizedAgents;
  if (effectiveAgents.length === 0 && normalizedCustom.length === 0) {
    effectiveAgents = mode === "status" ? ALL_DEFAULT_AGENTS : ["claude"];
  } else if (effectiveAgents.includes("all")) {
    effectiveAgents = ALL_DEFAULT_AGENTS;
  }

  const roots = [];
  const seenPaths = new Set();

  const pushRoot = (entry) => {
    const fullPath = resolve(entry.path);
    if (seenPaths.has(fullPath)) return;
    seenPaths.add(fullPath);
    roots.push({
      agent: entry.agent,
      scope: entry.scope ?? entry.agent,
      path: fullPath,
    });
  };

  for (const agentName of effectiveAgents) {
    pushRoot(mapAgentRoot(agentName, { home, cwd }));
  }

  for (const dir of normalizedCustom) {
    pushRoot({ agent: "custom", scope: "custom", path: resolve(dir) });
  }

  return roots;
}

function normalizeTargets(targets, { mode = "link" } = {}) {
  if (!targets || targets.length === 0) {
    return resolveTargetRoots({ mode });
  }
  return targets.map((target) => {
    if (typeof target === "string") {
      return { agent: "custom", scope: "custom", path: resolve(target) };
    }
    return {
      agent: target.agent ?? "custom",
      scope: target.scope ?? target.agent ?? "custom",
      path: resolve(target.path),
    };
  });
}

/**
 * Link selected skills from `skillsDir` into each target root.
 * Never deletes a real (non-symlink) directory or file, even when `force: true`.
 */
export function linkSkills({
  skillsDir = DEFAULT_SKILLS_DIR,
  targets,
  includeMeta = false,
  only = [],
  force = false,
  dryRun = false,
} = {}) {
  const skills = listRepoSkills(skillsDir, { includeMeta, only });
  const resolvedTargets = normalizeTargets(targets, { mode: "link" });
  const linkType = process.platform === "win32" ? "junction" : "dir";
  const results = [];

  for (const target of resolvedTargets) {
    for (const skill of skills) {
      const dest = join(target.path, skill.name);
      const sourcePath = resolve(skill.skillDir);
      const sourceReal = safeRealpath(sourcePath);
      const lstat = safeLstat(dest);

      if (lstat) {
        if (lstat.isSymbolicLink()) {
          const destReal = existsSync(dest) ? safeRealpath(dest) : null;
          if (destReal && sourceReal && destReal === sourceReal) {
            results.push({
              agent: target.agent,
              scope: target.scope,
              skill: skill.name,
              source: sourcePath,
              target: dest,
              status: "already-linked",
            });
            continue;
          }

          if (force) {
            if (!dryRun) {
              rmSync(dest, { recursive: true, force: true });
              mkdirSync(target.path, { recursive: true });
              symlinkSync(sourcePath, dest, linkType);
            }
            results.push({
              agent: target.agent,
              scope: target.scope,
              skill: skill.name,
              source: sourcePath,
              target: dest,
              status: "replaced",
            });
          } else {
            results.push({
              agent: target.agent,
              scope: target.scope,
              skill: skill.name,
              source: sourcePath,
              target: dest,
              status: "conflict",
              reason: "existing link points elsewhere",
            });
          }
          continue;
        }

        results.push({
          agent: target.agent,
          scope: target.scope,
          skill: skill.name,
          source: sourcePath,
          target: dest,
          status: "conflict",
          reason: "destination is a non-symlink directory or file",
        });
        continue;
      }

      if (!dryRun) {
        mkdirSync(target.path, { recursive: true });
        symlinkSync(sourcePath, dest, linkType);
      }
      results.push({
        agent: target.agent,
        scope: target.scope,
        skill: skill.name,
        source: sourcePath,
        target: dest,
        status: dryRun ? "would-link" : "linked",
      });
    }
  }

  const conflicts = results.filter((item) => item.status === "conflict");
  return { results, conflicts };
}

/**
 * Unlink skills that point to this repository (or broken links with a matching skill name).
 * Leaves real directories and symlinks to other repositories untouched.
 */
export function unlinkSkills({
  skillsDir = DEFAULT_SKILLS_DIR,
  targets,
  includeMeta = true,
  only = [],
  dryRun = false,
} = {}) {
  const skills = listRepoSkills(skillsDir, { includeMeta, only });
  const resolvedTargets = normalizeTargets(targets, { mode: "unlink" });
  const results = [];

  for (const target of resolvedTargets) {
    for (const skill of skills) {
      const dest = join(target.path, skill.name);
      const sourcePath = resolve(skill.skillDir);
      const sourceReal = safeRealpath(sourcePath);
      const lstat = safeLstat(dest);

      if (!lstat) {
        results.push({
          agent: target.agent,
          scope: target.scope,
          skill: skill.name,
          source: sourcePath,
          target: dest,
          status: "not-installed",
        });
        continue;
      }

      if (lstat.isSymbolicLink()) {
        const destExists = existsSync(dest);
        const destReal = destExists ? safeRealpath(dest) : null;
        const matchesRepo = !destExists || Boolean(destReal && sourceReal && destReal === sourceReal);

        if (matchesRepo) {
          if (!dryRun) {
            rmSync(dest, { recursive: true, force: true });
          }
          results.push({
            agent: target.agent,
            scope: target.scope,
            skill: skill.name,
            source: sourcePath,
            target: dest,
            status: dryRun ? "would-unlink" : "unlinked",
          });
        } else {
          results.push({
            agent: target.agent,
            scope: target.scope,
            skill: skill.name,
            source: sourcePath,
            target: dest,
            status: "skipped",
            reason: "points to a different skill source",
          });
        }
        continue;
      }

      results.push({
        agent: target.agent,
        scope: target.scope,
        skill: skill.name,
        source: sourcePath,
        target: dest,
        status: "skipped",
        reason: "destination is a non-symlink directory or file",
      });
    }
  }

  return { results };
}

/**
 * Read-only inspection of link status across target roots.
 */
export function statusSkills({
  skillsDir = DEFAULT_SKILLS_DIR,
  targets,
  includeMeta = true,
  only = [],
} = {}) {
  const skills = listRepoSkills(skillsDir, { includeMeta, only });
  const resolvedTargets = normalizeTargets(targets, { mode: "status" });
  const results = [];

  for (const target of resolvedTargets) {
    for (const skill of skills) {
      const dest = join(target.path, skill.name);
      const sourcePath = resolve(skill.skillDir);
      const sourceReal = safeRealpath(sourcePath);
      const lstat = safeLstat(dest);

      if (!lstat) {
        results.push({
          agent: target.agent,
          scope: target.scope,
          skill: skill.name,
          source: sourcePath,
          target: dest,
          status: "missing",
        });
        continue;
      }

      if (lstat.isSymbolicLink()) {
        const destExists = existsSync(dest);
        const destReal = destExists ? safeRealpath(dest) : null;
        if (destReal && sourceReal && destReal === sourceReal) {
          results.push({
            agent: target.agent,
            scope: target.scope,
            skill: skill.name,
            source: sourcePath,
            target: dest,
            status: "linked",
          });
        } else {
          results.push({
            agent: target.agent,
            scope: target.scope,
            skill: skill.name,
            source: sourcePath,
            target: dest,
            status: "conflict",
            reason: destExists ? "existing link points elsewhere" : "broken symlink",
          });
        }
        continue;
      }

      results.push({
        agent: target.agent,
        scope: target.scope,
        skill: skill.name,
        source: sourcePath,
        target: dest,
        status: "conflict",
        reason: "destination is a non-symlink directory or file",
      });
    }
  }

  const conflicts = results.filter((item) => item.status === "conflict");
  return { results, conflicts };
}

function extractTitle(body, fallbackName) {
  const match = body.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallbackName;
}

function extractScopeSummary(description) {
  const firstSentence = String(description ?? "")
    .split(/\.\s+/)[0]
    .replace(/\.$/, "")
    .trim();
  return firstSentence || "Domain engineering advisor";
}

function extractNanoRulesets(body) {
  const normalized = String(body ?? "").replace(/\r\n/g, "\n");
  const header = "## 3. Condensed Nano Rulesets";
  const startIdx = normalized.indexOf(header);
  if (startIdx === -1) return "";
  const afterHeader = normalized.slice(startIdx + header.length).replace(/^[^\n]*\n/, "");
  const nextSectionMatch = afterHeader.match(/\n(?:---\n+)?## /);
  const sectionBody = nextSectionMatch
    ? afterHeader.slice(0, nextSectionMatch.index)
    : afterHeader;
  return sectionBody.replace(/\n---\s*$/, "").trim();
}

/**
 * Deterministically compile a compact universal fallback `AGENTS.md` from
 * the selected advisors in `skillsDir`.
 */
export function compileAgentsMarkdown({
  skillsDir = DEFAULT_SKILLS_DIR,
  includeMeta = false,
  only = [],
} = {}) {
  const skills = listRepoSkills(skillsDir, { includeMeta, only });
  const parsedSkills = skills.map((skill) => {
    const raw = readFileSync(skill.skillMd, "utf8");
    const { body } = parseFrontmatter(raw);
    return {
      ...skill,
      title: extractTitle(body, skill.name),
      scopeSummary: extractScopeSummary(skill.description),
      nanoRules: extractNanoRulesets(body),
    };
  });

  const lines = [];
  lines.push("# Agent Advisors — Condensed Fallback Rules (`AGENTS.md`)");
  lines.push("");
  lines.push(
    "> Generated deterministically from `skills/*/SKILL.md` for environments without native multi-skill routing. When your runtime supports `SKILL.md` discovery, prefer linking the full skill directories via `node scripts/link_skills.mjs` so Level-2 facades and Level-3 `references/` load on demand.",
  );
  lines.push("");
  lines.push("## Included Advisors");
  lines.push("");
  lines.push("| Advisor | Scope | Full Facade |");
  lines.push("| :--- | :--- | :--- |");
  for (const skill of parsedSkills) {
    lines.push(
      `| \`${skill.name}\` | ${skill.scopeSummary} | \`skills/${skill.name}/SKILL.md\` |`,
    );
  }
  lines.push("");
  lines.push("## Shared Operating Boundaries");
  lines.push("");
  lines.push(
    "- **Project conventions first.** Existing architecture decisions, migrations, middlewares, linters, tests, and explicit user instructions outrank any doctrine here. Name conflicts rather than silently breaking working code.",
  );
  lines.push(
    "- **Defer the workflow, keep the rationale.** When a dedicated review, testing, debugging, security scanning, or planning workflow governs the task, let that workflow run its steps and use these advisors for the engineering trade-offs behind them.",
  );
  lines.push(
    "- **Match doctrine to problem size (Proportionality Ladder).** Exhaust existing project patterns, standard library capabilities, and simple flat constructs before introducing new abstractions, layers, or dependencies.",
  );
  lines.push(
    "- **Intentional Deferrals.** When omitting heavier patterns (e.g., DDD aggregates, distributed rate limiters, read replicas) for proportionality, state the concrete scale or threat trigger threshold that would justify introducing them later.",
  );
  lines.push("");
  lines.push("## Condensed Nano Rulesets");

  for (const skill of parsedSkills) {
    if (!skill.nanoRules) continue;
    lines.push("");
    lines.push(`### ${skill.title} (\`${skill.name}\`)`);
    lines.push("");
    lines.push(skill.nanoRules);
  }

  lines.push("");
  return lines.join("\n");
}

export function parseArgs(argv) {
  const options = {
    agents: [],
    customDirs: [],
    only: [],
    includeMeta: false,
    unlink: false,
    status: false,
    force: false,
    dryRun: false,
    emitAgents: null,
    json: false,
    help: false,
  };

  const nextValue = (arg, value) => {
    if (!value || (value.startsWith("-") && value !== "-")) {
      throw new Error(`Missing or invalid value for ${arg}`);
    }
    return value;
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--agent") {
      const value = nextValue(arg, argv[++i]);
      options.agents.push(
        ...value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      );
    } else if (arg === "--dir") {
      options.customDirs.push(nextValue(arg, argv[++i]));
    } else if (arg === "--skill") {
      const value = nextValue(arg, argv[++i]);
      options.only.push(
        ...value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      );
    } else if (arg === "--include-meta") {
      options.includeMeta = true;
    } else if (arg === "--unlink") {
      options.unlink = true;
    } else if (arg === "--status") {
      options.status = true;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--emit-agents") {
      options.emitAgents = nextValue(arg, argv[++i]);
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (options.unlink && options.status) {
    throw new Error("Cannot combine --unlink and --status");
  }

  return options;
}

const USAGE = `Usage: node scripts/link_skills.mjs [options]

Options:
  --agent <name>        Target agent (claude, claude-project, cursor, codex, gemini, cc-switch, all)
  --dir <path>          Custom target skills directory (repeatable)
  --skill <name>        Filter to specific skill name(s) (repeatable or comma-separated)
  --include-meta        Include meta-skills such as advisor-creator
  --unlink              Remove symlinks/junctions pointing to this repository
  --status              Inspect installation status across target roots (read-only)
  --force               Replace existing symlinks pointing elsewhere (never deletes real folders)
  --dry-run             Report planned actions without modifying the filesystem
  --emit-agents <file>  Compile universal fallback AGENTS.md to <file> (use '-' for stdout)
  --json                Emit machine-readable JSON output
  -h, --help            Show this help message`;

export function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log(USAGE);
    return 0;
  }

  const hasExplicitTargets = options.agents.length > 0 || options.customDirs.length > 0;
  const hasExplicitMode = options.unlink || options.status || hasExplicitTargets;

  if (options.emitAgents) {
    const markdown = compileAgentsMarkdown({
      includeMeta: options.includeMeta,
      only: options.only,
    });
    if (options.emitAgents === "-") {
      process.stdout.write(markdown);
    } else {
      const outPath = resolve(options.emitAgents);
      if (!options.dryRun) {
        mkdirSync(dirname(outPath), { recursive: true });
        writeFileSync(outPath, markdown, "utf8");
      }
      if (!options.json) {
        console.log(
          `${options.dryRun ? "Would write" : "Wrote"} compiled AGENTS.md to ${toPosix(outPath)}`,
        );
      }
    }
    if (!hasExplicitMode) {
      if (options.json && options.emitAgents !== "-") {
        console.log(
          JSON.stringify(
            {
              action: "emit-agents",
              output: toPosix(resolve(options.emitAgents)),
              dryRun: options.dryRun,
            },
            null,
            2,
          ),
        );
      }
      return 0;
    }
  }

  const mode = options.status ? "status" : options.unlink ? "unlink" : "link";
  const targets = resolveTargetRoots({
    agents: options.agents,
    customDirs: options.customDirs,
    mode,
  });

  if (mode === "status") {
    const { results, conflicts } = statusSkills({
      targets,
      includeMeta: options.includeMeta || true,
      only: options.only,
    });
    if (options.json) {
      console.log(JSON.stringify({ mode, results, conflicts }, null, 2));
    } else {
      for (const item of results) {
        const suffix = item.reason ? ` (${item.reason})` : "";
        console.log(`[${item.status}] ${item.scope}: ${item.skill} -> ${toPosix(item.target)}${suffix}`);
      }
    }
    return conflicts.length > 0 ? 1 : 0;
  }

  if (mode === "unlink") {
    const { results } = unlinkSkills({
      targets,
      includeMeta: options.includeMeta || true,
      only: options.only,
      dryRun: options.dryRun,
    });
    if (options.json) {
      console.log(JSON.stringify({ mode, dryRun: options.dryRun, results }, null, 2));
    } else {
      for (const item of results) {
        const suffix = item.reason ? ` (${item.reason})` : "";
        console.log(`[${item.status}] ${item.scope}: ${item.skill} (${toPosix(item.target)})${suffix}`);
      }
    }
    return 0;
  }

  const { results, conflicts } = linkSkills({
    targets,
    includeMeta: options.includeMeta,
    only: options.only,
    force: options.force,
    dryRun: options.dryRun,
  });

  if (options.json) {
    console.log(JSON.stringify({ mode, dryRun: options.dryRun, results, conflicts }, null, 2));
  } else {
    for (const item of results) {
      const suffix = item.reason ? ` (${item.reason})` : "";
      console.log(`[${item.status}] ${item.scope}: ${item.skill} -> ${toPosix(item.target)}${suffix}`);
    }
  }

  return conflicts.length > 0 ? 1 : 0;
}

const invokedDirectly =
  resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  try {
    process.exit(main());
  } catch (error) {
    console.error(`link_skills failed: ${error.message}`);
    process.exit(1);
  }
}
