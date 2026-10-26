#!/usr/bin/env node
/**
 * Symlink / junction installer, standalone copy distributor, and universal AGENTS.md compiler.
 *
 * Distributes domain advisors from `skills/` into supported agent skill directories
 * (Claude Code, Cursor, Gemini/Antigravity, Codex, cc-switch) without clobbering non-symlink
 * user folders, or compiles a synchronized Condensed Nano Ruleset bundle for runtimes
 * without native multi-skill routing. Supports both interactive terminal wizard and scriptable CLI flags.
 *
 * Usage:
 *   node scripts/link_skills.mjs                             # Interactive terminal wizard (when in TTY)
 *   node scripts/link_skills.mjs --client claude,gemini      # Scripted distribution
 *   node scripts/link_skills.mjs --client cursor -p <dir>    # Project-scoped installation
 *   node scripts/link_skills.mjs --copy                      # Standalone decoupled copy mode
 *   node scripts/link_skills.mjs --status                    # Inspect installation status across runtimes
 *   node scripts/link_skills.mjs --unlink                    # Clean uninstallation
 */

import {
  cpSync,
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
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
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
    case "cursor-user":
      return { agent: "cursor", scope: "cursor-user", path: join(home, ".cursor", "skills") };
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
 * Detect runtime skill environments currently present on the system.
 */
export function detectInstalledAgents({ home = homedir(), cwd = process.cwd() } = {}) {
  const detected = [];
  if (existsSync(join(home, ".claude"))) detected.push("claude");
  if (existsSync(join(home, ".gemini"))) detected.push("gemini");
  if (existsSync(join(home, ".codex"))) detected.push("codex");
  if (existsSync(join(home, ".cc-switch"))) detected.push("cc-switch");
  if (existsSync(join(home, ".cursor"))) detected.push("cursor-user");
  if (existsSync(join(cwd, ".cursor"))) detected.push("cursor-project");
  if (existsSync(join(cwd, ".claude"))) detected.push("claude-project");
  return [...new Set(detected)];
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
    if (mode === "status") {
      effectiveAgents = ALL_DEFAULT_AGENTS;
    } else {
      const detected = detectInstalledAgents({ home, cwd });
      effectiveAgents = detected.length > 0 ? detected : ["claude"];
    }
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
 * Link or copy selected skills from `skillsDir` into each target root.
 * Never deletes a real (non-symlink) directory or file when in link mode, even when `force: true`.
 */
export function linkSkills({
  skillsDir = DEFAULT_SKILLS_DIR,
  targets,
  includeMeta = false,
  only = [],
  copy = false,
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

      if (copy) {
        if (lstat) {
          if (force) {
            if (!dryRun) {
              rmSync(dest, { recursive: true, force: true });
              mkdirSync(dest, { recursive: true });
              cpSync(sourcePath, dest, { recursive: true });
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
              reason: "destination already exists (use --force to replace)",
            });
          }
          continue;
        }

        if (!dryRun) {
          mkdirSync(dest, { recursive: true });
          cpSync(sourcePath, dest, { recursive: true });
        }
        results.push({
          agent: target.agent,
          scope: target.scope,
          skill: skill.name,
          source: sourcePath,
          target: dest,
          status: dryRun ? "would-copy" : "copied",
        });
        continue;
      }

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
    copy: false,
    unlink: false,
    status: false,
    force: false,
    dryRun: false,
    emitAgents: null,
    projectDir: null,
    interactive: false,
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
    if (arg === "--agent" || arg === "--client" || arg === "-c") {
      const value = nextValue(arg, argv[++i]);
      options.agents.push(
        ...value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      );
    } else if (arg === "--project" || arg === "-p") {
      options.projectDir = nextValue(arg, argv[++i]);
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
    } else if (arg === "--include-meta" || arg === "--all" || arg === "-a") {
      options.includeMeta = true;
    } else if (arg === "--copy") {
      options.copy = true;
    } else if (arg === "--unlink") {
      options.unlink = true;
    } else if (arg === "--status" || arg === "--list") {
      options.status = true;
    } else if (arg === "--force" || arg === "-f") {
      options.force = true;
    } else if (arg === "--dry-run" || arg === "-n") {
      options.dryRun = true;
    } else if (arg === "--interactive" || arg === "-i") {
      options.interactive = true;
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

Zero-dependency installer and manager for AI coding agent advisors.

Options:
  --client, --agent, -c <name>  Target agent(s): claude, cursor, gemini, codex, cc-switch, all
                                (default: auto-detects installed agent environments)
  --project, -p <dir>           Target project directory for project-scoped links (.cursor, .claude)
  --dir <path>                  Custom target skills directory (repeatable)
  --skill <name>                Filter to specific skill name(s) (repeatable or comma-separated)
  --include-meta, --all, -a     Include meta-skills such as advisor-creator (default: domain advisors only)
  --copy                        Standalone copy mode (decoupled from repository; files remain if repo is deleted)
  --unlink                      Remove symlinks/junctions pointing to this repository
  --status, --list              Inspect installation status across target roots (read-only)
  --force, -f                   Replace existing symlinks/copies (never deletes real folders in link mode)
  --dry-run, -n                 Report planned actions without modifying the filesystem
  --interactive, -i             Launch terminal interactive wizard
  --emit-agents <file>          Compile universal fallback AGENTS.md to <file> (use '-' for stdout)
  --json                        Emit machine-readable JSON output
  -h, --help                    Show this help message`;

export async function runInteractiveWizard({ skillsDir = DEFAULT_SKILLS_DIR } = {}) {
  const rl = createInterface({ input, output });
  try {
    output.write("\n╔════════════════════════════════════════════════════════════════════════╗\n");
    output.write("║           Agent Advisors — Interactive Skill Installer                 ║\n");
    output.write("║  Zero-dependency distributor for Claude Code, Cursor, Gemini & Codex   ║\n");
    output.write("╚════════════════════════════════════════════════════════════════════════╝\n\n");

    const detected = detectInstalledAgents();
    output.write("Detected Agent Environments:\n");
    if (detected.length > 0) {
      for (const a of detected) {
        output.write(`  [●] ${a}\n`);
      }
    } else {
      output.write("  (No standard agent directories detected)\n");
    }
    output.write("\n");

    output.write("Select target client(s):\n");
    output.write(`  1. All detected clients ${detected.length > 0 ? "(Recommended)" : ""}\n`);
    output.write("  2. Claude Code (~/.claude/skills)\n");
    output.write("  3. Cursor (specify project directory or current project)\n");
    output.write("  4. Google Antigravity / Gemini CLI (~/.gemini/skills)\n");
    output.write("  5. OpenAI Codex CLI (~/.codex/skills)\n");
    output.write("  6. cc-switch central distribution store (~/.cc-switch/skills)\n");
    output.write("  7. Custom directory\n");
    const targetAns = (await rl.question("\nEnter choice [1-7] (default: 1): ")).trim() || "1";

    let agents = [];
    let customDirs = [];
    let projectDir = null;

    if (targetAns === "1") {
      agents = detected.length > 0 ? detected : ["claude"];
    } else if (targetAns === "2") {
      agents = ["claude"];
    } else if (targetAns === "3") {
      const proj = (await rl.question("Target project path (leave empty for current directory): ")).trim();
      agents = ["cursor"];
      if (proj) projectDir = proj;
    } else if (targetAns === "4") {
      agents = ["gemini"];
    } else if (targetAns === "5") {
      agents = ["codex"];
    } else if (targetAns === "6") {
      agents = ["cc-switch"];
    } else if (targetAns === "7") {
      const dir = (await rl.question("Enter custom directory path: ")).trim();
      if (!dir) throw new Error("Directory path cannot be empty");
      customDirs = [dir];
    }

    output.write("\nSkills to install:\n");
    output.write("  1. All domain advisors (software-design, api-security, data-storage) [Recommended]\n");
    output.write("  2. All skills including advisor-creator meta-skill\n");
    const skillAns = (await rl.question("\nEnter choice [1-2] (default: 1): ")).trim() || "1";
    const includeMeta = skillAns === "2";

    output.write("\nInstallation mode:\n");
    output.write("  1. Symlink / Junction (Recommended: updates automatically on git pull)\n");
    output.write("  2. Standalone Copy (Decoupled: copies files, can safely delete this repository)\n");
    const modeAns = (await rl.question("\nEnter choice [1-2] (default: 1): ")).trim() || "1";
    const copy = modeAns === "2";

    output.write(`\nReady to ${copy ? "copy" : "link"} advisors. Proceed? [Y/n]: `);
    const confirm = (await rl.question("")).trim().toLowerCase();
    if (confirm && confirm !== "y" && confirm !== "yes") {
      output.write("Aborted.\n");
      return 0;
    }

    const targets = resolveTargetRoots({
      agents,
      customDirs,
      cwd: projectDir ? resolve(projectDir) : process.cwd(),
      mode: "link",
    });

    const { results, conflicts } = linkSkills({
      skillsDir,
      targets,
      includeMeta,
      copy,
      force: false,
      dryRun: false,
    });

    output.write("\nInstallation Summary:\n\n");
    for (const item of results) {
      const symbol = item.status === "linked" || item.status === "copied" ? "✔" : item.status === "already-linked" ? "ℹ" : "✖";
      output.write(`  ${symbol} [${item.status}] ${item.scope}: ${item.skill} -> ${toPosix(item.target)}\n`);
    }
    output.write("\nComplete! Your AI coding agents can now access the domain advisors.\n\n");
    return conflicts.length > 0 ? 1 : 0;
  } finally {
    rl.close();
  }
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log(USAGE);
    return 0;
  }

  const hasExplicitTargets = options.agents.length > 0 || options.customDirs.length > 0;
  const hasExplicitMode = options.unlink || options.status || options.emitAgents || options.copy || hasExplicitTargets;

  const isInteractive =
    (options.interactive || (Boolean(process.stdin.isTTY) && argv.length === 0)) &&
    !options.json &&
    !hasExplicitMode;

  if (isInteractive) {
    return runInteractiveWizard();
  }

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
    if (!options.unlink && !options.status && !hasExplicitTargets) {
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
  const projectCwd = options.projectDir ? resolve(options.projectDir) : process.cwd();
  const targets = resolveTargetRoots({
    agents: options.agents,
    customDirs: options.customDirs,
    cwd: projectCwd,
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
      console.log("\nAgent Advisors — Skill Link Status\n");
      for (const item of results) {
        const symbol =
          item.status === "linked"
            ? "✔ [linked]"
            : item.status === "missing"
              ? "○ [missing]"
              : "✖ [conflict]";
        const suffix = item.reason ? ` (${item.reason})` : "";
        console.log(`  ${symbol.padEnd(13)} ${item.scope.padEnd(16)} ${item.skill} -> ${toPosix(item.target)}${suffix}`);
      }
      console.log("");
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
      console.log(`\nAgent Advisors — ${options.dryRun ? "Dry-run Unlinking" : "Unlinking"} Advisors\n`);
      for (const item of results) {
        const symbol =
          item.status === "unlinked" || item.status === "would-unlink"
            ? "✔ [unlinked]"
            : item.status === "not-installed"
              ? "○ [not-installed]"
              : "⚠ [skipped]";
        const suffix = item.reason ? ` (${item.reason})` : "";
        console.log(`  ${symbol.padEnd(18)} ${item.scope.padEnd(16)} ${item.skill} -> ${toPosix(item.target)}${suffix}`);
      }
      const unlinkedCount = results.filter((r) => r.status === "unlinked" || r.status === "would-unlink").length;
      console.log(`\nSummary: ${unlinkedCount} unlinked.\n`);
    }
    return 0;
  }

  const { results, conflicts } = linkSkills({
    targets,
    includeMeta: options.includeMeta,
    only: options.only,
    copy: options.copy,
    force: options.force,
    dryRun: options.dryRun,
  });

  if (options.json) {
    console.log(JSON.stringify({ mode, dryRun: options.dryRun, results, conflicts }, null, 2));
  } else {
    console.log(`\nAgent Advisors — ${options.dryRun ? "Dry-run " : ""}${options.copy ? "Copying" : "Linking"} Advisors\n`);
    for (const item of results) {
      const symbol =
        item.status === "linked" || item.status === "would-link" || item.status === "copied" || item.status === "would-copy"
          ? "✔"
          : item.status === "already-linked"
            ? "ℹ"
            : item.status === "replaced"
              ? "↺"
              : "✖";
      const suffix = item.reason ? ` (${item.reason})` : "";
      console.log(`  ${symbol} [${item.status}] ${item.scope.padEnd(16)} ${item.skill} -> ${toPosix(item.target)}${suffix}`);
    }
    const successCount = results.filter((r) => r.status === "linked" || r.status === "replaced" || r.status === "would-link" || r.status === "copied" || r.status === "would-copy").length;
    const existingCount = results.filter((r) => r.status === "already-linked").length;
    console.log(`\nSummary: ${successCount} processed, ${existingCount} already present, ${conflicts.length} conflict(s).`);
    if (conflicts.length > 0) {
      console.log("Tip: Pass --force to replace existing symlinks or files.");
    } else {
      console.log("Ready to use! Try asking your agent: 'Help me refactor this legacy order service'.");
    }
    console.log("");
  }

  return conflicts.length > 0 ? 1 : 0;
}

const invokedDirectly =
  Boolean(process.argv[1]) &&
  resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();

if (invokedDirectly) {
  Promise.resolve(main())
    .then((code) => process.exit(code ?? 0))
    .catch((error) => {
      console.error(`link_skills failed: ${error.message}`);
      process.exit(1);
    });
}
