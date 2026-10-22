#!/usr/bin/env node
/**
 * Inventory and conflict audit for installed agent skills.
 *
 * This tool is read-only: it never installs, removes, or rewrites a skill. It
 * reports what is installed, what costs context every turn, and which skills
 * are competing for the same triggers.
 *
 * Usage:
 *   node scripts/audit_skills.mjs [--out .advisor-audit] [--threshold 0.3]
 *                                 [--root scope=path]... [--no-defaults]
 *                                 [--json] [--fail-on-issues]
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  overlapScore,
  readSkill,
  structuralIssues,
} from "./lib/skill.mjs";

const HOME = homedir();
const CWD = process.cwd();

const DEFAULT_ROOTS = [
  { scope: "claude-project", agent: "claude", path: join(CWD, ".claude", "skills") },
  { scope: "claude-user", agent: "claude", path: join(HOME, ".claude", "skills") },
  { scope: "cursor-project", agent: "cursor", path: join(CWD, ".cursor", "skills") },
  { scope: "codex", agent: "codex", path: join(HOME, ".codex", "skills") },
  { scope: "gemini", agent: "gemini", path: join(HOME, ".gemini", "skills") },
  { scope: "cc-switch", agent: "store", path: join(HOME, ".cc-switch", "skills") },
];

/**
 * Only plugins recorded as installed are loaded by the agent. Marketplace
 * checkouts are sources, not installed skills, so they must not be counted.
 */
export function installedPluginRoots(home = HOME) {
  const registry = join(home, ".claude", "plugins", "installed_plugins.json");
  if (!existsSync(registry)) return [];
  try {
    const data = JSON.parse(readFileSync(registry, "utf8"));
    const roots = [];
    for (const [id, installs] of Object.entries(data.plugins ?? {})) {
      for (const install of installs ?? []) {
        if (!install.installPath) continue;
        roots.push({
          scope: `claude-plugin:${id.split("@")[0]}`,
          agent: "claude",
          path: install.installPath,
          recursive: true,
        });
      }
    }
    return roots;
  } catch {
    return [];
  }
}

const AGENT_LABELS = {
  claude: "Claude Code",
  cursor: "Cursor",
  codex: "Codex",
  gemini: "Gemini / Antigravity",
  store: "cc-switch store",
};

const toPosix = (value) => value.split(sep).join("/");

function isDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/** Find skill directories under a root. */
export function findSkillDirs(root, { recursive = false } = {}) {
  if (!existsSync(root)) return { dirs: [], broken: [] };
  const dirs = [];
  const broken = [];
  const seen = new Set();

  const visit = (dir, depth) => {
    let real;
    try {
      real = realpathSync(dir);
    } catch {
      return;
    }
    if (seen.has(real)) return;
    seen.add(real);

    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const full = join(dir, entry.name);
      if (!isDirectory(full)) {
        if (entry.isSymbolicLink()) broken.push(full);
        continue;
      }
      if (existsSync(join(full, "SKILL.md"))) dirs.push(full);
      if (recursive && depth < 6) visit(full, depth + 1);
    }
  };

  if (existsSync(join(root, "SKILL.md"))) dirs.push(root);
  visit(root, 0);
  return { dirs: [...new Set(dirs)], broken };
}

/** Read every skill under the given roots. */
export function discover(roots) {
  const records = [];
  const broken = [];
  const skipped = [];

  for (const root of roots) {
    if (!existsSync(root.path)) {
      skipped.push(root);
      continue;
    }
    const { dirs, broken: brokenLinks } = findSkillDirs(root.path, { recursive: root.recursive });
    for (const link of brokenLinks) broken.push({ scope: root.scope, path: link });

    for (const dir of dirs) {
      try {
        const record = readSkill(dir, { scope: root.scope, agent: root.agent });
        records.push({
          ...record,
          path: dir,
          dirName: basename(dir),
          realpath: realpathSync(dir),
          isSymlink: dir !== realpathSync(dir),
        });
      } catch (error) {
        records.push({
          name: basename(dir),
          path: dir,
          dirName: basename(dir),
          scope: root.scope,
          agent: root.agent,
          realpath: dir,
          readError: error.message,
          description: "",
          descriptionTokens: 0,
          lineCount: 0,
          terms: new Set(),
          tags: new Set(),
          overbroad: [],
          references: [],
          unlinkedReferences: [],
          missingReferences: [],
          executableFiles: [],
        });
      }
    }
  }

  return { records, broken, skipped };
}

/** Group records by real path; symlinked installs are one skill, not many. */
export function uniqueSkills(records) {
  const byReal = new Map();
  for (const record of records) {
    const existing = byReal.get(record.realpath);
    if (existing) {
      existing.instances.push({ scope: record.scope, path: record.path });
    } else {
      byReal.set(record.realpath, {
        ...record,
        instances: [{ scope: record.scope, path: record.path }],
      });
    }
  }
  return [...byReal.values()];
}

/** Group records by agent, collapsing symlinked duplicates within that agent. */
export function perAgentSkills(records) {
  const agents = new Map();
  for (const record of records) {
    if (!agents.has(record.agent)) agents.set(record.agent, new Map());
    const skills = agents.get(record.agent);
    if (!skills.has(record.realpath)) skills.set(record.realpath, record);
  }
  return new Map([...agents].map(([agent, skills]) => [agent, [...skills.values()]]));
}

/** Analyze the inventory. Semantic verdicts are deliberately not produced. */
export function analyze(records, { threshold = 0.4, overlapAgents = new Set(["claude"]) } = {}) {
  const skills = uniqueSkills(records);
  const issues = [];
  const collisions = [];
  const agents = perAgentSkills(records);

  for (const skill of skills) {
    if (skill.readError) {
      issues.push({ level: "error", name: skill.name, scope: skill.scope, message: skill.readError });
      continue;
    }
    for (const issue of structuralIssues(skill)) {
      issues.push({ level: issue.level, name: skill.name, scope: skill.scope, message: issue.message });
    }
    const dirs = skill.instances.map((instance) => instance.scope);
    if (new Set(dirs).size > 1) {
      issues.push({
        level: "info",
        name: skill.name,
        scope: dirs.join(", "),
        message: `installed through ${dirs.length} roots (same real path)`,
      });
    }
  }

  for (const [agent, list] of agents) {
    const byName = new Map();
    for (const skill of list) {
      if (!byName.has(skill.name)) byName.set(skill.name, []);
      byName.get(skill.name).push(skill);
    }
    for (const [name, group] of byName) {
      if (group.length < 2) continue;
      const scopes = [...new Set(group.map((skill) => skill.scope))];
      const hasPlugin = scopes.some((scope) => scope.startsWith("claude-plugin"));
      const identical = new Set(group.map((skill) => skill.contentHash)).size === 1;
      collisions.push({ agent, name, scopes, pluginOnly: hasPlugin, identical });
      issues.push({
        level: hasPlugin || identical ? "warn" : "error",
        name,
        scope: `${agent}: ${scopes.join(", ")}`,
        message: hasPlugin
          ? "same name in a plugin and another scope (namespaced, check semantic overlap)"
          : identical
            ? "same skill copied into multiple scopes (check which one the loader prefers)"
            : "same name resolves to different skill directories",
      });
    }
  }

  const budgets = {};
  const overlaps = {};
  for (const [agent, list] of agents) {
    budgets[agent] = {
      skills: list.length,
      descriptionTokens: list.reduce((sum, skill) => sum + (skill.descriptionTokens ?? 0), 0),
      characters: list.reduce((sum, skill) => sum + (skill.description?.length ?? 0), 0),
    };
    if (list.length < 2 || (overlapAgents !== null && !overlapAgents.has(agent))) {
      overlaps[agent] = [];
      continue;
    }
    const pairs = [];
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const a = list[i];
        const b = list[j];
        if (a.name === b.name) continue;
        const result = overlapScore(a, b);
        if (result.score < threshold) continue;
        pairs.push({
          a: { name: a.name, scope: a.scope, description: a.description },
          b: { name: b.name, scope: b.scope, description: b.description },
          ...result,
        });
      }
    }
    overlaps[agent] = pairs.sort((x, y) => y.score - x.score);
  }

  return { skills, issues, collisions, budgets, overlaps, threshold, overlapAgents };
}

export function renderMarkdown(result, { roots, broken, skipped, generatedAt = new Date() } = {}) {
  const lines = [];
  lines.push("# Skill Audit");
  lines.push("");
  lines.push(`Generated: ${generatedAt.toISOString()}`);
  lines.push("");
  lines.push("Read-only report. Nothing was installed, removed, or rewritten.");
  lines.push("");

  lines.push("## Roots");
  lines.push("");
  for (const root of roots) {
    const exists = existsSync(root.path);
    lines.push(`- \`${root.scope}\` — ${toPosix(root.path)}${exists ? "" : " (absent)"}`);
  }
  if (skipped.length > 0) lines.push(`- skipped absent roots: ${skipped.length}`);
  if (broken.length > 0) {
    lines.push(`- broken symlinks: ${broken.length}`);
    for (const item of broken.slice(0, 10)) lines.push(`  - \`${item.scope}\`: ${toPosix(item.path)}`);
  }
  lines.push("");

  lines.push("## Trigger budget");
  lines.push("");
  lines.push("Descriptions are loaded on every turn. References are not included.");
  lines.push("");
  lines.push("| Agent | Installed skills | Description tokens / turn |");
  lines.push("| :--- | ---: | ---: |");
  for (const [agent, budget] of Object.entries(result.budgets)) {
    lines.push(`| ${AGENT_LABELS[agent] ?? agent} | ${budget.skills} | ~${budget.descriptionTokens} |`);
  }
  lines.push("");

  const claudeSkills = result.skills
    .filter((skill) => skill.agent === "claude")
    .sort((a, b) => (b.descriptionTokens ?? 0) - (a.descriptionTokens ?? 0))
    .slice(0, 12);
  if (claudeSkills.length > 0) {
    lines.push("### Largest Claude Code descriptions");
    lines.push("");
    lines.push("| Skill | Scope | Tokens | Lines |");
    lines.push("| :--- | :--- | ---: | ---: |");
    for (const skill of claudeSkills) {
      lines.push(
        `| \`${skill.name}\` | ${skill.scope} | ~${skill.descriptionTokens} | ${skill.lineCount} |`,
      );
    }
    lines.push("");
  }

  const errors = result.issues.filter((issue) => issue.level === "error");
  const warnings = result.issues.filter((issue) => issue.level === "warn");
  const infos = result.issues.filter((issue) => issue.level === "info");

  lines.push("## Problems");
  lines.push("");
  if (errors.length === 0 && warnings.length === 0) {
    lines.push("No structural problems found.");
  } else {
    for (const issue of [...errors, ...warnings]) {
      lines.push(`- **${issue.level}** \`${issue.name}\` (${issue.scope}): ${issue.message}`);
    }
  }
  lines.push("");
  if (infos.length > 0) {
    lines.push("<details><summary>Informational notes</summary>");
    lines.push("");
    for (const issue of infos) {
      lines.push(`- \`${issue.name}\` (${issue.scope}): ${issue.message}`);
    }
    lines.push("");
    lines.push("</details>");
    lines.push("");
  }

  lines.push("## Overlap candidates");
  lines.push("");
  lines.push(
    `Pairs scoring at or above ${result.threshold}. A high score means both descriptions claim similar triggers; it does not prove the advice conflicts. Read the pair, then decide keep / merge / remove.`,
  );
  if (result.overlapAgents !== null) {
    const compared = [...result.overlapAgents].map((agent) => AGENT_LABELS[agent] ?? agent).join(", ");
    lines.push("");
    lines.push(`Compared runtimes: ${compared}. Use \`--agents all\` to compare every installed runtime.`);
  }
  lines.push("");
  let pairCount = 0;
  for (const [agent, pairs] of Object.entries(result.overlaps)) {
    if (pairs.length === 0) continue;
    lines.push(`### ${AGENT_LABELS[agent] ?? agent}`);
    lines.push("");
    lines.push(`Showing ${Math.min(15, pairs.length)} of ${pairs.length} candidate pair(s).`);
    lines.push("");
    lines.push("| Skills | Score | Shared domains | Shared terms |");
    lines.push("| :--- | ---: | :--- | :--- |");
    for (const pair of pairs.slice(0, 15)) {
      pairCount += 1;
      lines.push(
        `| \`${pair.a.name}\` ↔ \`${pair.b.name}\` | ${pair.score} | ${pair.sharedTags.join(", ") || "—"} | ${pair.sharedTerms.slice(0, 5).join(", ") || "—"} |`,
      );
    }
    lines.push("");
  }
  if (pairCount === 0) lines.push("No candidate pairs above the threshold.");
  lines.push("");

  const broad = result.skills.filter((skill) => (skill.overbroad?.length ?? 0) > 0);
  lines.push("## Broad trigger wording");
  lines.push("");
  if (broad.length === 0) {
    lines.push("No broad trigger wording detected.");
  } else {
    lines.push("These descriptions claim a wide surface and are the usual cause of over-triggering.");
    lines.push("");
    for (const skill of broad) {
      lines.push(`- \`${skill.name}\` (${skill.scope}): ${skill.overbroad.join(", ")}`);
    }
  }
  lines.push("");

  lines.push("## What this report cannot tell you");
  lines.push("");
  lines.push("- Whether two skills actually give contradictory advice. That requires reading them, or an LLM arbitration pass.");
  lines.push("- Whether a skill improves outcomes. That needs the blind comparison in `evals/outcome-protocol.md`.");
  lines.push("- Which skill to remove. The report lists candidates; the decision stays with you.");
  lines.push("");

  return lines.join("\n");
}

export function buildLock(result, { roots, generatedAt = new Date() } = {}) {
  return {
    version: 1,
    generatedAt: generatedAt.toISOString(),
    roots: roots.map((root) => ({ scope: root.scope, agent: root.agent, path: toPosix(root.path) })),
    budgets: result.budgets,
    skills: result.skills
      .map((skill) => ({
        name: skill.name,
        agent: skill.agent,
        scope: skill.scope,
        path: toPosix(skill.path),
        realpath: toPosix(skill.realpath),
        contentHash: skill.contentHash,
        description: skill.description,
        descriptionTokens: skill.descriptionTokens,
        lineCount: skill.lineCount,
        references: skill.references.length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

function parseArgs(argv) {
  const options = {
    out: join(CWD, ".advisor-audit"),
    threshold: 0.4,
    roots: [],
    useDefaults: true,
    json: false,
    failOnIssues: false,
    overlapAgents: new Set(["claude"]),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out") options.out = resolve(argv[++i]);
    else if (arg === "--threshold") options.threshold = Number(argv[++i]);
    else if (arg === "--root") {
      const value = argv[++i] ?? "";
      const split = value.indexOf("=");
      if (split <= 0) throw new Error("--root expects scope=path");
      options.roots.push({
        scope: value.slice(0, split),
        agent: value.slice(0, split).split("-")[0],
        path: resolve(value.slice(split + 1)),
      });
    } else if (arg === "--no-defaults") options.useDefaults = false;
    else if (arg === "--agents") {
      const value = argv[++i] ?? "";
      options.overlapAgents =
        value === "all"
          ? null
          : new Set(value.split(",").map((agent) => agent.trim()).filter(Boolean));
    }
    else if (arg === "--json") options.json = true;
    else if (arg === "--fail-on-issues") options.failOnIssues = true;
    else if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/audit_skills.mjs [--out DIR] [--threshold N] [--agents claude|all|list] [--root scope=path]... [--no-defaults] [--json] [--fail-on-issues]");
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

export function runAudit(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const roots = options.useDefaults
    ? [...DEFAULT_ROOTS, ...installedPluginRoots(), ...options.roots]
    : options.roots;
  const { records, broken, skipped } = discover(roots);
  const result = analyze(records, {
    threshold: options.threshold,
    overlapAgents: options.overlapAgents,
  });

  if (options.json) {
    console.log(JSON.stringify(buildLock(result, { roots }), null, 2));
  } else {
    const report = renderMarkdown(result, { roots, broken, skipped });
    const lock = buildLock(result, { roots });
    mkdirSync(options.out, { recursive: true });
    writeFileSync(join(options.out, "audit-report.md"), `${report}\n`, "utf8");
    writeFileSync(join(options.out, "skills.lock.json"), `${JSON.stringify(lock, null, 2)}\n`, "utf8");

    const errors = result.issues.filter((issue) => issue.level === "error").length;
    const warnings = result.issues.filter((issue) => issue.level === "warn").length;
    const pairs = Object.values(result.overlaps).reduce((sum, list) => sum + list.length, 0);
    const budgets = Object.entries(result.budgets)
      .map(([agent, budget]) => `${AGENT_LABELS[agent] ?? agent}: ${budget.skills} skills, ~${budget.descriptionTokens} tokens/turn`)
      .join("; ");
    console.log(`Scanned ${result.skills.length} unique skills.`);
    console.log(budgets || "No skills found.");
    console.log(`${errors} error(s), ${warnings} warning(s), ${pairs} overlap candidate pair(s).`);
    console.log(`Report: ${toPosix(join(options.out, "audit-report.md"))}`);
    console.log(`Lockfile: ${toPosix(join(options.out, "skills.lock.json"))}`);
  }

  if (options.failOnIssues) {
    return result.issues.some((issue) => issue.level === "error") ? 1 : 0;
  }
  return 0;
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  try {
    process.exit(runAudit());
  } catch (error) {
    console.error(`audit failed: ${error.message}`);
    process.exit(1);
  }
}
