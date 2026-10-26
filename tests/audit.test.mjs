import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  analyze,
  buildLock,
  discover,
  installedPluginRoots,
  renderMarkdown,
} from "../scripts/audit_skills.mjs";

function makeSkill(root, name, { description, body = "# Skill\n", extra = "" } = {}) {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "SKILL.md"),
    `---\nname: ${name}\ndescription: ${description}\nlicense: MIT\n---\n\n${body}${extra}`,
    "utf8",
  );
  return dir;
}

function tempRoot(prefix = "aa-audit-") {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(dir, { recursive: true });
  return dir;
}

test("discovers skills and computes a per-agent description budget", () => {
  const root = tempRoot();
  try {
    makeSkill(root, "alpha", { description: "Refactor legacy modules and protect behavior with seams." });
    makeSkill(root, "beta", { description: "Design module interfaces with deep modules and information hiding." });
    const roots = [{ scope: "claude-user", agent: "claude", path: root }];
    const { records } = discover(roots);
    const result = analyze(records, { threshold: 0.2 });

    assert.equal(result.skills.length, 2);
    assert.equal(result.budgets.claude.skills, 2);
    assert.ok(result.budgets.claude.descriptionTokens > 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("counting the same root twice does not double the budget", () => {
  const root = tempRoot();
  try {
    makeSkill(root, "alpha", { description: "Review code for defects." });
    const rootEntry = { scope: "claude-user", agent: "claude", path: root };
    const result = analyze(discover([rootEntry, rootEntry]).records);
    assert.equal(result.budgets.claude.skills, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("flags the same name resolving to different directories", () => {
  const first = tempRoot();
  const second = tempRoot();
  try {
    makeSkill(first, "alpha", { description: "Review code for defects." });
    makeSkill(second, "alpha", { description: "Design module boundaries." });
    const result = analyze(
      discover([
        { scope: "claude-user", agent: "claude", path: first },
        { scope: "claude-project", agent: "claude", path: second },
      ]).records,
    );
    const collision = result.issues.find((issue) => issue.message.includes("same name resolves"));
    assert.ok(collision, "expected a name collision");
    assert.equal(collision.level, "error");
  } finally {
    rmSync(first, { recursive: true, force: true });
    rmSync(second, { recursive: true, force: true });
  }
});

test("treats identical copies as a warning, not a failure", () => {
  const first = tempRoot();
  const second = tempRoot();
  try {
    makeSkill(first, "alpha", { description: "Review code for defects." });
    makeSkill(second, "alpha", { description: "Review code for defects." });
    const result = analyze(
      discover([
        { scope: "claude-user", agent: "claude", path: first },
        { scope: "claude-project", agent: "claude", path: second },
      ]).records,
    );
    const collision = result.issues.find((issue) => issue.message.includes("copied into multiple scopes"));
    assert.ok(collision, "expected an identical-copy note");
    assert.equal(collision.level, "warn");
  } finally {
    rmSync(first, { recursive: true, force: true });
    rmSync(second, { recursive: true, force: true });
  }
});

test("finds overlapping trigger descriptions", () => {
  const root = tempRoot();
  try {
    makeSkill(root, "alpha", { description: "Refactor legacy code with seams and characterization tests." });
    makeSkill(root, "beta", { description: "Refactor legacy code using seams and characterization tests." });
    makeSkill(root, "gamma", { description: "Generate slide presentations and posters." });
    const result = analyze(discover([{ scope: "claude-user", agent: "claude", path: root }]).records, {
      threshold: 0.2,
      overlapAgents: new Set(["claude"]),
    });
    assert.equal(result.overlaps.claude.length, 1);
    assert.equal(result.overlaps.claude[0].a.name, "alpha");
    assert.equal(result.overlaps.claude[0].b.name, "beta");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("skips uninstalled marketplace checkouts", () => {
  const home = tempRoot("aa-home-");
  try {
    const pluginDir = join(home, "plugin");
    mkdirSync(pluginDir, { recursive: true });
    const registry = join(home, ".claude", "plugins");
    mkdirSync(registry, { recursive: true });
    writeFileSync(
      join(registry, "installed_plugins.json"),
      JSON.stringify({
        version: 2,
        plugins: {
          "demo@marketplace": [{ scope: "user", installPath: pluginDir }],
        },
      }),
      "utf8",
    );

    const roots = installedPluginRoots(home);
    assert.equal(roots.length, 1);
    assert.equal(roots[0].path, pluginDir);
    assert.match(roots[0].scope, /^claude-plugin:/);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("excludes cc-switch store from runtime budgets", () => {
  const claudeRoot = tempRoot();
  const storeRoot = tempRoot();
  try {
    makeSkill(claudeRoot, "alpha", { description: "Review code for defects." });
    makeSkill(storeRoot, "stored", { description: "Stored skill in cc-switch." });
    const { records, broken } = discover([
      { scope: "claude-user", agent: "claude", path: claudeRoot },
      { scope: "cc-switch", agent: "store", path: storeRoot },
    ]);
    const result = analyze(records, {}, broken);
    assert.ok(result.budgets.claude);
    assert.equal(result.budgets.store, undefined);
  } finally {
    rmSync(claudeRoot, { recursive: true, force: true });
    rmSync(storeRoot, { recursive: true, force: true });
  }
});

test("reports broken symlinks as errors in analyze", () => {
  const root = tempRoot();
  try {
    makeSkill(root, "alpha", { description: "Review code for defects." });
    const brokenPath = join(root, "dangling-skill");
    let symlinkCreated = false;
    try {
      symlinkSync(join(root, "does-not-exist"), brokenPath, "dir");
      symlinkCreated = true;
    } catch {
      // On Windows without Developer Mode/admin privileges, fall back to synthetic broken list.
    }
    const { records, broken } = discover([{ scope: "claude-user", agent: "claude", path: root }]);
    const effectiveBroken = symlinkCreated ? broken : [{ scope: "claude-user", path: brokenPath }];
    const result = analyze(records, {}, effectiveBroken);
    const brokenIssue = result.issues.find((issue) => issue.kind === "broken-symlink");
    assert.ok(brokenIssue, "expected broken-symlink issue");
    assert.equal(brokenIssue.level, "error");
    assert.equal(brokenIssue.name, "dangling-skill");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("deduplicates physical copies across claude-user, codex, and cc-switch into one logical skill", () => {
  const claudeRoot = tempRoot();
  const codexRoot = tempRoot();
  const storeRoot = tempRoot();
  try {
    const spec = { description: "Refactor legacy modules with characterization tests." };
    makeSkill(claudeRoot, "shared-skill", spec);
    makeSkill(codexRoot, "shared-skill", spec);
    makeSkill(storeRoot, "shared-skill", spec);

    const roots = [
      { scope: "claude-user", agent: "claude", path: claudeRoot },
      { scope: "codex", agent: "codex", path: codexRoot },
      { scope: "cc-switch", agent: "store", path: storeRoot },
    ];
    const { records, broken } = discover(roots);
    const result = analyze(records, {}, broken);

    assert.equal(result.skills.length, 1);
    assert.equal(result.skills[0].instances.length, 3);
    const copyNote = result.issues.find((issue) =>
      /identical copy across 3 directories/.test(issue.message),
    );
    assert.ok(copyNote, "expected an identical copy info note across 3 directories");
    assert.equal(copyNote.level, "info");
  } finally {
    rmSync(claudeRoot, { recursive: true, force: true });
    rmSync(codexRoot, { recursive: true, force: true });
    rmSync(storeRoot, { recursive: true, force: true });
  }
});

test("emits a warn issue when the same skill name has content drift across roots", () => {
  const claudeRoot = tempRoot();
  const storeRoot = tempRoot();
  try {
    makeSkill(claudeRoot, "drifted-skill", {
      description: "Review API designs and module contracts.",
      body: "# Version 1\n",
    });
    makeSkill(storeRoot, "drifted-skill", {
      description: "Review API designs, module contracts, and OpenAPI schemas.",
      body: "# Version 2\n",
    });

    const roots = [
      { scope: "claude-user", agent: "claude", path: claudeRoot },
      { scope: "cc-switch", agent: "store", path: storeRoot },
    ];
    const { records, broken } = discover(roots);
    const result = analyze(records, {}, broken);

    assert.equal(result.skills.length, 2);
    const driftIssue = result.issues.find((issue) =>
      /content drift across roots/.test(issue.message),
    );
    assert.ok(driftIssue, "expected content drift warning");
    assert.equal(driftIssue.level, "warn");
    assert.equal(driftIssue.name, "drifted-skill");
  } finally {
    rmSync(claudeRoot, { recursive: true, force: true });
    rmSync(storeRoot, { recursive: true, force: true });
  }
});

test("renders end-to-end markdown report and builds lockfile JSON structure", () => {
  const claudeRoot = tempRoot();
  try {
    makeSkill(claudeRoot, "alpha", {
      description: "Refactor legacy code with seams and characterization tests whenever needed.",
    });
    makeSkill(claudeRoot, "beta", {
      description: "Refactor legacy code using seams and characterization tests.",
    });

    const roots = [{ scope: "claude-user", agent: "claude", path: claudeRoot }];
    const { records, broken, skipped } = discover(roots);
    const result = analyze(records, { threshold: 0.2, overlapAgents: new Set(["claude"]) }, broken);
    const generatedAt = new Date("2026-01-15T00:00:00.000Z");

    const markdown = renderMarkdown(result, { roots, broken, skipped, generatedAt });
    assert.match(markdown, /^# Skill Audit/m);
    assert.match(markdown, /^## Trigger budget/m);
    assert.match(markdown, /^## Problems/m);
    assert.match(markdown, /^## Overlap candidates/m);
    assert.match(markdown, /^## What this report cannot tell you/m);
    assert.match(markdown, /`alpha` ↔ `beta`/);

    const lock = buildLock(result, { roots, generatedAt });
    assert.equal(lock.version, 1);
    assert.equal(lock.generatedAt, "2026-01-15T00:00:00.000Z");
    assert.equal(lock.roots.length, 1);
    assert.ok(lock.budgets.claude);
    assert.ok(Array.isArray(lock.issues));
    assert.equal(lock.skills.length, 2);
    assert.deepEqual(
      lock.skills.map((s) => s.name),
      ["alpha", "beta"],
    );
    assert.ok(lock.skills[0].contentHash);
    assert.equal(lock.skills[0].instances.length, 1);
  } finally {
    rmSync(claudeRoot, { recursive: true, force: true });
  }
});

