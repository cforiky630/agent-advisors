import assert from "node:assert/strict";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  DEFAULT_SKILLS_DIR,
  compileAgentsMarkdown,
  detectInstalledAgents,
  linkSkills,
  listRepoSkills,
  parseArgs,
  resolveTargetRoots,
  statusSkills,
  unlinkSkills,
} from "../scripts/link_skills.mjs";

function tempDir(prefix = "aa-link-") {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(dir, { recursive: true });
  return dir;
}

test("links only *-advisor skills by default and includes advisor-creator when includeMeta is true", () => {
  const targetDir = tempDir();
  try {
    const defaultSkills = listRepoSkills(DEFAULT_SKILLS_DIR);
    assert.ok(defaultSkills.length >= 3);
    assert.ok(defaultSkills.every((skill) => skill.name.endsWith("-advisor")));
    assert.ok(!defaultSkills.some((skill) => skill.name === "advisor-creator"));

    const allSkills = listRepoSkills(DEFAULT_SKILLS_DIR, { includeMeta: true });
    assert.ok(allSkills.some((skill) => skill.name === "advisor-creator"));

    const targets = resolveTargetRoots({ customDirs: [targetDir] });
    const first = linkSkills({ targets, includeMeta: false });
    assert.equal(first.conflicts.length, 0);
    assert.ok(first.results.every((item) => item.status === "linked"));
    assert.ok(existsSync(join(targetDir, "software-design-advisor", "SKILL.md")));
    assert.ok(existsSync(join(targetDir, "api-security-advisor", "SKILL.md")));
    assert.ok(existsSync(join(targetDir, "data-storage-advisor", "SKILL.md")));
    assert.equal(existsSync(join(targetDir, "advisor-creator")), false);

    const second = linkSkills({ targets, includeMeta: true });
    assert.equal(second.conflicts.length, 0);
    const creatorResult = second.results.find((item) => item.skill === "advisor-creator");
    assert.ok(creatorResult);
    assert.equal(creatorResult.status, "linked");
    assert.ok(existsSync(join(targetDir, "advisor-creator", "SKILL.md")));
  } finally {
    rmSync(targetDir, { recursive: true, force: true });
  }
});

test("idempotent re-linking returns already-linked without error", () => {
  const targetDir = tempDir();
  try {
    const targets = resolveTargetRoots({ customDirs: [targetDir] });
    const first = linkSkills({ targets, only: ["software-design-advisor"] });
    assert.equal(first.conflicts.length, 0);
    assert.equal(first.results.length, 1);
    assert.equal(first.results[0].status, "linked");

    const second = linkSkills({ targets, only: ["software-design-advisor"] });
    assert.equal(second.conflicts.length, 0);
    assert.equal(second.results.length, 1);
    assert.equal(second.results[0].status, "already-linked");

    const status = statusSkills({ targets, only: ["software-design-advisor"] });
    assert.equal(status.conflicts.length, 0);
    assert.equal(status.results[0].status, "linked");
  } finally {
    rmSync(targetDir, { recursive: true, force: true });
  }
});

test("refuses to overwrite a real non-symlink directory even when force is true", () => {
  const targetDir = tempDir();
  try {
    const realSkillDir = join(targetDir, "software-design-advisor");
    mkdirSync(realSkillDir, { recursive: true });
    const markerFile = join(realSkillDir, "user-custom.txt");
    writeFileSync(markerFile, "do not delete", "utf8");

    const targets = resolveTargetRoots({ customDirs: [targetDir] });
    const { results, conflicts } = linkSkills({
      targets,
      only: ["software-design-advisor"],
      force: true,
    });

    assert.equal(conflicts.length, 1);
    assert.equal(results[0].status, "conflict");
    assert.match(results[0].reason, /non-symlink/);
    assert.equal(readFileSync(markerFile, "utf8"), "do not delete");
    assert.equal(lstatSync(realSkillDir).isSymbolicLink(), false);
  } finally {
    rmSync(targetDir, { recursive: true, force: true });
  }
});

test("replaces a symlink pointing to another directory when force is true", () => {
  const targetDir = tempDir();
  const otherSource = tempDir("aa-other-");
  try {
    const foreignSkill = join(otherSource, "software-design-advisor");
    mkdirSync(foreignSkill, { recursive: true });
    writeFileSync(join(foreignSkill, "SKILL.md"), "# Foreign\n", "utf8");

    const dest = join(targetDir, "software-design-advisor");
    const linkType = process.platform === "win32" ? "junction" : "dir";
    symlinkSync(foreignSkill, dest, linkType);

    const targets = resolveTargetRoots({ customDirs: [targetDir] });

    const withoutForce = linkSkills({
      targets,
      only: ["software-design-advisor"],
      force: false,
    });
    assert.equal(withoutForce.conflicts.length, 1);
    assert.equal(withoutForce.results[0].status, "conflict");
    assert.match(withoutForce.results[0].reason, /points elsewhere/);

    const withForce = linkSkills({
      targets,
      only: ["software-design-advisor"],
      force: true,
    });
    assert.equal(withForce.conflicts.length, 0);
    assert.equal(withForce.results[0].status, "replaced");
    assert.equal(
      realpathSync(dest),
      realpathSync(join(DEFAULT_SKILLS_DIR, "software-design-advisor")),
    );
    // Ensure the foreign directory itself was not deleted
    assert.ok(existsSync(join(foreignSkill, "SKILL.md")));
  } finally {
    rmSync(targetDir, { recursive: true, force: true });
    rmSync(otherSource, { recursive: true, force: true });
  }
});

test("unlinkSkills removes linked junctions/symlinks while leaving unrelated directories untouched", () => {
  const targetDir = tempDir();
  const otherSource = tempDir("aa-foreign-");
  try {
    const targets = resolveTargetRoots({ customDirs: [targetDir] });
    linkSkills({ targets, only: ["software-design-advisor"] });

    // Create a real non-symlink directory for api-security-advisor
    const realDir = join(targetDir, "api-security-advisor");
    mkdirSync(realDir, { recursive: true });
    writeFileSync(join(realDir, "keep.txt"), "keep", "utf8");

    // Create a symlink pointing to another repo for data-storage-advisor
    const foreignDir = join(otherSource, "data-storage-advisor");
    mkdirSync(foreignDir, { recursive: true });
    const linkType = process.platform === "win32" ? "junction" : "dir";
    symlinkSync(foreignDir, join(targetDir, "data-storage-advisor"), linkType);

    // Create an unrelated user skill directory
    const unrelatedDir = join(targetDir, "my-custom-skill");
    mkdirSync(unrelatedDir, { recursive: true });
    writeFileSync(join(unrelatedDir, "SKILL.md"), "# Custom\n", "utf8");

    const { results } = unlinkSkills({ targets, includeMeta: true });
    const bySkill = new Map(results.map((item) => [item.skill, item]));

    assert.equal(bySkill.get("software-design-advisor").status, "unlinked");
    assert.equal(existsSync(join(targetDir, "software-design-advisor")), false);
    // Repo skill source must remain intact after unlinking
    assert.ok(existsSync(join(DEFAULT_SKILLS_DIR, "software-design-advisor", "SKILL.md")));

    assert.equal(bySkill.get("api-security-advisor").status, "skipped");
    assert.ok(existsSync(join(realDir, "keep.txt")));

    assert.equal(bySkill.get("data-storage-advisor").status, "skipped");
    assert.ok(existsSync(join(targetDir, "data-storage-advisor")));

    assert.equal(bySkill.get("advisor-creator").status, "not-installed");
    assert.ok(existsSync(join(unrelatedDir, "SKILL.md")));
  } finally {
    rmSync(targetDir, { recursive: true, force: true });
    rmSync(otherSource, { recursive: true, force: true });
  }
});

test("compileAgentsMarkdown deterministically synthesizes Condensed Nano Rulesets and Proportionality Ladder", () => {
  const first = compileAgentsMarkdown();
  const second = compileAgentsMarkdown();

  assert.equal(first, second);
  assert.match(first, /skills\/\*\/SKILL\.md/);
  assert.match(first, /Condensed Nano Rulesets/);
  assert.match(first, /Proportionality Ladder/);
  assert.match(first, /Project conventions first/);
  assert.match(first, /Defer the workflow/);
  assert.match(first, /Intentional Deferrals/);

  // Includes all three domain advisors and their A..D nano ruleset subsections
  assert.match(first, /`api-security-advisor`/);
  assert.match(first, /`data-storage-advisor`/);
  assert.match(first, /`software-design-advisor`/);
  assert.match(first, /### A\. Authorization & Access Control/);
  assert.match(first, /### A\. Query Tuning & Indexing/);
  assert.match(first, /### A\. Construction & Pragmatism/);
  assert.match(first, /### D\. Architecture, Domain & Resilience/);
});

test("resolveTargetRoots maps agent aliases and listRepoSkills rejects unknown skill names", () => {
  const home = "/tmp/fake-home";
  const cwd = "/tmp/fake-cwd";

  const defaultLink = resolveTargetRoots({ home, cwd });
  assert.equal(defaultLink.length, 1);
  assert.equal(defaultLink[0].agent, "claude");
  assert.ok(defaultLink[0].path.endsWith(join(".claude", "skills")));

  const defaultStatus = resolveTargetRoots({ home, cwd, mode: "status" });
  assert.equal(defaultStatus.length, 6);

  const explicit = resolveTargetRoots({
    agents: ["claude-project", "cursor", "codex", "antigravity", "cc-switch"],
    home,
    cwd,
  });
  assert.equal(explicit.length, 5);

  assert.throws(
    () => listRepoSkills(DEFAULT_SKILLS_DIR, { only: ["non-existent-skill"] }),
    /Unknown skill 'non-existent-skill'/,
  );
});

test("detectInstalledAgents discovers present runtime directories and falls back cleanly", () => {
  const fakeHome = tempDir("aa-detect-home-");
  const fakeCwd = tempDir("aa-detect-cwd-");
  try {
    const empty = detectInstalledAgents({ home: fakeHome, cwd: fakeCwd });
    assert.deepEqual(empty, []);

    mkdirSync(join(fakeHome, ".gemini"), { recursive: true });
    mkdirSync(join(fakeHome, ".claude"), { recursive: true });
    mkdirSync(join(fakeCwd, ".cursor"), { recursive: true });

    const detected = detectInstalledAgents({ home: fakeHome, cwd: fakeCwd });
    assert.ok(detected.includes("claude"));
    assert.ok(detected.includes("gemini"));
    assert.ok(detected.includes("cursor-project"));

    const autoRoots = resolveTargetRoots({ home: fakeHome, cwd: fakeCwd, mode: "link" });
    assert.equal(autoRoots.length, 3);
  } finally {
    rmSync(fakeHome, { recursive: true, force: true });
    rmSync(fakeCwd, { recursive: true, force: true });
  }
});

test("copy mode physically copies skill directories allowing repository decoupling", () => {
  const targetDir = tempDir("aa-copy-");
  try {
    const targets = resolveTargetRoots({ customDirs: [targetDir] });
    const result = linkSkills({
      targets,
      only: ["api-security-advisor"],
      copy: true,
    });

    assert.equal(result.conflicts.length, 0);
    assert.equal(result.results[0].status, "copied");

    const installedSkill = join(targetDir, "api-security-advisor");
    assert.ok(existsSync(join(installedSkill, "SKILL.md")));
    // Must be a physical directory, not a symbolic link or junction
    assert.equal(lstatSync(installedSkill).isSymbolicLink(), false);
  } finally {
    rmSync(targetDir, { recursive: true, force: true });
  }
});

test("parseArgs parses aliases including --client, -c, --project, -p, --all, -a, --copy, and --list", () => {
  const parsed = parseArgs([
    "--client",
    "cursor,gemini",
    "-p",
    "/custom/project/path",
    "-a",
    "--copy",
    "--list",
    "-f",
    "-n",
  ]);

  assert.deepEqual(parsed.agents, ["cursor", "gemini"]);
  assert.equal(parsed.projectDir, "/custom/project/path");
  assert.equal(parsed.includeMeta, true);
  assert.equal(parsed.copy, true);
  assert.equal(parsed.status, true);
  assert.equal(parsed.force, true);
  assert.equal(parsed.dryRun, true);
});
