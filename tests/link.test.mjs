import assert from "node:assert/strict";
import {
  existsSync,
  cpSync,
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
import { dirname, join } from "node:path";
import test from "node:test";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { spawnSync } from "node:child_process";

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
import { readSkill } from "../scripts/lib/skill.mjs";

function tempDir(prefix = "aa-link-") {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  mkdirSync(dir, { recursive: true });
  return dir;
}

test("installer rejects path-like or mismatched skill names before changing destinations", () => {
  const root = tempDir();
  try {
    const skillDir = join(root, "source", "demo-advisor");
    mkdirSync(skillDir, { recursive: true });
    const marker = join(root, "keep.txt");
    writeFileSync(marker, "keep");
    for (const name of ["../../escape", "other-advisor"]) {
      writeFileSync(join(skillDir, "SKILL.md"), `---\nname: ${name}\ndescription: Review modules.\nlicense: MIT\n---\n`);
      assert.throws(() => linkSkills({ skillsDir: join(root, "source"), targets: [root], copy: true, force: true }), /Invalid skill name/);
      assert.equal(readFileSync(marker, "utf8"), "keep");
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("unlink preserves a matching-name broken link belonging to a foreign source", () => {
  const root = tempDir();
  const dest = join(root, "software-design-advisor");
  try {
    symlinkSync(join(root, "foreign", "missing"), dest, process.platform === "win32" ? "junction" : "dir");
    const result = unlinkSkills({ targets: [root], only: ["software-design-advisor"] });
    assert.equal(result.results[0].status, "skipped");
    assert.ok(lstatSync(dest).isSymbolicLink());
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("CLI fallback export refuses existing project rules unless force is explicit", () => {
  const root = tempDir();
  try {
    const output = join(root, "AGENTS.md");
    writeFileSync(output, "Existing project rules\n");
    const args = ["scripts/link_skills.mjs", "--emit-agents", output, "--json"];
    const denied = spawnSync(process.execPath, args, { encoding: "utf8" });
    assert.equal(denied.status, 1);
    assert.equal(readFileSync(output, "utf8"), "Existing project rules\n");
    const forced = spawnSync(process.execPath, [...args, "--force"], { encoding: "utf8" });
    assert.equal(forced.status, 0, forced.stderr);
    assert.match(readFileSync(output, "utf8"), /Shared Operating Boundaries/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

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
  assert.match(first, /Discuss deferred alternatives only when relevant; do not invent thresholds/);
  assert.match(first, /\*\*Probe\*\*/);
  assert.match(first, /\*\*Invalidate When\*\*/);
  assert.match(first, /Runtime Checkpoint Procedure/);
  assert.match(first, /Do not repeat consultation on unchanged evidence/);
  assert.equal((first.match(/### Runtime Checkpoint Procedure\n/g) ?? []).length, 1);
  assert.equal((first.match(/\*\*Multiple advisors\.\*\*/g) ?? []).length, 1);
  assert.doesNotMatch(first, /state the concrete scale or threat trigger threshold/);

  // Includes all three domain advisors and their A..D nano ruleset subsections
  assert.match(first, /`api-security-advisor`/);
  assert.match(first, /`data-storage-advisor`/);
  assert.match(first, /`software-design-advisor`/);
  assert.match(first, /### A\. Authorization & Access Control/);
  assert.match(first, /### A\. Query Tuning & Indexing/);
  assert.match(first, /### A\. Construction & Pragmatism/);
  assert.match(first, /### D\. Architecture, Domain & Resilience/);
});

test("fallback keeps different advisor boundaries and checkpoint variants instead of silently dropping them", () => {
  const root = tempDir();
  try {
    for (const name of ["a-advisor", "b-advisor"]) {
      const dir = join(root, name);
      mkdirSync(dir);
      writeFileSync(join(dir, "SKILL.md"), `---\nname: ${name}\ndescription: Architecture guidance.\nlicense: MIT\n---\n# ${name}\n\n## Operating Boundaries\n\nOnly ${name} owns its local policy.\n\n### Runtime Checkpoint Procedure\n\nCheck ${name} risk.\n\n## 3. Condensed Nano Rulesets\n\nKeep ${name} invariant.\n`);
    }
    const result = compileAgentsMarkdown({ skillsDir: root });
    for (const name of ["a-advisor", "b-advisor"]) {
      assert.match(result, new RegExp(`Only ${name} owns its local policy`));
      assert.match(result, new RegExp(`Check ${name} risk`));
      assert.match(result, new RegExp(`Keep ${name} invariant`));
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("fallback includes a usable creator workflow in meta-only and mixed selections", () => {
  for (const options of [{ only: ["advisor-creator"] }, { includeMeta: true }]) {
    const result = compileAgentsMarkdown(options);
    assert.match(result, /#### Authoring Workflow/);
    assert.match(result, /relative to this installed skill directory/);
    assert.match(result, /only when that project script is confirmed to validate these skills/);
    assert.equal((result.match(/### Runtime Checkpoint Procedure\n/g) ?? []).length, 1);
  }
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
    const status = statusSkills({ targets, only: ["api-security-advisor"] });
    assert.equal(status.conflicts.length, 0);
    assert.equal(status.results[0].status, "copied");
    writeFileSync(join(installedSkill, "references", "cryptographic-hygiene.md"), "Changed rules\n");
    assert.equal(statusSkills({ targets, only: ["api-security-advisor"] }).conflicts.length, 1);
  } finally {
    rmSync(targetDir, { recursive: true, force: true });
  }
});

test("copy refuses equal, nested, ancestor and junction-aliased source paths without deleting files", () => {
  const root = tempDir();
  const source = join(root, "demo-advisor", "demo-advisor");
  mkdirSync(source, { recursive: true });
  const entry = join(source, "SKILL.md");
  const text = "---\nname: demo-advisor\ndescription: Architecture guidance.\nlicense: MIT\n---\n# Demo\n";
  writeFileSync(entry, text);
  try {
    const alias = join(root, "alias");
    symlinkSync(join(root, "demo-advisor"), alias, process.platform === "win32" ? "junction" : "dir");
    for (const target of [join(root, "demo-advisor"), source, root, alias]) {
      for (const dryRun of [false, true]) {
        const result = linkSkills({ skillsDir: join(root, "demo-advisor"), targets: [target], copy: true, force: true, dryRun });
        assert.equal(result.conflicts.length, 1);
        assert.match(result.results[0].reason, /overlap/);
        assert.equal(readFileSync(entry, "utf8"), text);
      }
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("forced copy stages data, reports dry runs and restores destination when final rename fails", (t) => {
  const targetDir = tempDir();
  const options = { targets: [targetDir], only: ["api-security-advisor"], copy: true, force: true };
  const marker = join(targetDir, "api-security-advisor", "keep.txt");
  mkdirSync(dirname(marker), { recursive: true });
  writeFileSync(marker, "original");
  const originalRename = fs.renameSync;
  try {
    const preview = linkSkills({ ...options, dryRun: true });
    assert.equal(preview.results[0].status, "would-replace");
    assert.equal(readFileSync(marker, "utf8"), "original");
    t.mock.method(fs, "cpSync", () => { throw new Error("simulated staging failure"); });
    syncBuiltinESMExports();
    assert.throws(() => linkSkills(options), /simulated staging failure/);
    assert.equal(readFileSync(marker, "utf8"), "original");
    t.mock.restoreAll();
    syncBuiltinESMExports();
    t.mock.method(fs, "renameSync", (from, to) => {
      if (from.endsWith(join("payload"))) throw new Error("simulated final rename failure");
      return originalRename(from, to);
    });
    syncBuiltinESMExports();
    assert.throws(() => linkSkills(options), /simulated final rename failure/);
    assert.equal(readFileSync(marker, "utf8"), "original");
    t.mock.restoreAll();
    syncBuiltinESMExports();
    assert.equal(linkSkills(options).results[0].status, "replaced");
    assert.ok(existsSync(join(targetDir, "api-security-advisor", "references", "cryptographic-hygiene.md")));
    assert.equal(existsSync(marker), false);
  } finally {
    t.mock.restoreAll();
    syncBuiltinESMExports();
    rmSync(targetDir, { recursive: true, force: true });
  }
});

test("standalone domains and creator keep local resources and cooperation rules after source removal", () => {
  const root = tempDir();
  const skillsDir = join(root, "source");
  const name = "software-design-advisor";
  const installed = join(root, "installed");
  try {
    cpSync(DEFAULT_SKILLS_DIR, skillsDir, { recursive: true });
    linkSkills({ skillsDir, targets: [installed], copy: true, includeMeta: true });
    rmSync(skillsDir, { recursive: true, force: true });
    const text = readFileSync(join(installed, name, "SKILL.md"), "utf8");
    assert.match(text, /Runtime Checkpoint Procedure/);
    assert.match(text, /packet: trigger, target advisor, inspected repo evidence/);
    assert.match(text, /Default to an inline self-review/);
    assert.match(text, /Escalate only for a missing user decision, authority/);
    for (const entry of listRepoSkills(installed, { includeMeta: true })) {
      const record = readSkill(entry.skillDir);
      assert.deepEqual(record.missingReferences, []);
      const body = readFileSync(record.skillMd, "utf8");
      assert.match(body, /\*\*Multiple advisors\.\*\*/);
      assert.match(body, /\*\*Reference precedence\.\*\*/);
      assert.ok(body.indexOf("## Quick Use") < body.indexOf("## 1."));
    }
    const creatorRoot = join(installed, "advisor-creator");
    assert.ok(existsSync(join(creatorRoot, "references", "advisor-template.md")));
    assert.equal(existsSync(join(root, "package.json")), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
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
