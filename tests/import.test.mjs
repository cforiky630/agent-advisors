import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  classifyFile,
  detectLicense,
  discoverCandidates,
  importRepo,
  repoSlug,
  validateSource,
} from "../scripts/import_repo.mjs";

const SKILL = "---\nname: demo-advisor\ndescription: Review legacy modules and refactoring seams.\nlicense: MIT\n---\n\n# Demo\n";

test("classifies skill-shaped markdown", () => {
  assert.equal(classifyFile("skills/demo/SKILL.md", SKILL), "skill");
  assert.equal(classifyFile("AGENTS.md", "# Rules"), "rules");
  assert.equal(classifyFile(".cursor/rules/style.mdc", "# Rule"), "rule");
  assert.equal(classifyFile("skills/demo/notes.md", "# Notes"), "reference");
  assert.equal(classifyFile("docs/guide.md", "# Guide"), null);
});

test("detects an MIT license", () => {
  const dir = mkdtempSync(join(tmpdir(), "aa-license-"));
  try {
    writeFileSync(
      join(dir, "LICENSE"),
      "MIT License\n\nPermission is hereby granted, free of charge, to any person obtaining a copy",
      "utf8",
    );
    assert.equal(detectLicense(dir).id, "MIT");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("refuses local sources unless explicitly allowed", () => {
  assert.throws(() => validateSource("C:/somewhere/repo"), /Refusing non-network source/);
  assert.equal(validateSource("https://github.com/acme/skills"), "https://github.com/acme/skills");
});

test("derives a repository slug", () => {
  assert.equal(repoSlug("https://github.com/acme/my-skills.git"), "my-skills");
});

test("discovers candidates and quarantines executable files", () => {
  const repo = mkdtempSync(join(tmpdir(), "aa-import-fixture-"));
  try {
    mkdirSync(join(repo, "skills", "demo"), { recursive: true });
    mkdirSync(join(repo, "scripts"), { recursive: true });
    writeFileSync(join(repo, "skills", "demo", "SKILL.md"), SKILL, "utf8");
    writeFileSync(join(repo, "AGENTS.md"), "# Team rules\n", "utf8");
    writeFileSync(join(repo, "scripts", "run.sh"), "echo hi\n", "utf8");
    writeFileSync(join(repo, "README.md"), "# Repository\n", "utf8");

    const result = discoverCandidates(repo);
    assert.equal(result.candidates.length, 2);
    assert.ok(result.executable.includes("scripts/run.sh"));
    assert.deepEqual(result.candidates.map((candidate) => candidate.kind).sort(), ["rules", "skill"]);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test("imports a local repository into quarantine and writes a proposal", () => {
  const repo = mkdtempSync(join(tmpdir(), "aa-import-repo-"));
  const out = mkdtempSync(join(tmpdir(), "aa-import-out-"));
  try {
    mkdirSync(join(repo, "skills", "demo"), { recursive: true });
    writeFileSync(
      join(repo, "LICENSE"),
      "MIT License\n\nPermission is hereby granted, free of charge",
      "utf8",
    );
    writeFileSync(join(repo, "skills", "demo", "SKILL.md"), SKILL, "utf8");
    writeFileSync(join(repo, "AGENTS.md"), "# Team rules\n", "utf8");

    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["add", "."], { cwd: repo });
    execFileSync(
      "git",
      ["-c", "user.email=test@example.com", "-c", "user.name=Test", "commit", "-qm", "init"],
      { cwd: repo },
    );

    const result = importRepo({
      source: repo,
      allowLocal: true,
      out,
      inventory: join(out, "missing-inventory.json"),
    });

    assert.equal(result.candidates.length, 2);
    assert.equal(result.commit.length, 40);
    assert.equal(result.license.id, "MIT");
    assert.ok(existsSync(join(out, "proposal.md")));
    assert.ok(existsSync(join(out, "manifest.json")));
    assert.ok(existsSync(join(out, "candidates", "skills", "demo", "SKILL.md")));

    const proposal = readFileSync(join(out, "proposal.md"), "utf8");
    assert.match(proposal, /did not install anything/i);
    assert.match(proposal, /Commit/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  }
});

test("rejects --subdir traversal outside the cloned repository", () => {
  const repo = mkdtempSync(join(tmpdir(), "aa-import-traversal-"));
  const outside = mkdtempSync(join(tmpdir(), "aa-import-outside-"));
  const out = mkdtempSync(join(tmpdir(), "aa-import-out-"));
  try {
    mkdirSync(join(repo, "skills", "demo"), { recursive: true });
    writeFileSync(join(repo, "skills", "demo", "SKILL.md"), SKILL, "utf8");
    writeFileSync(join(outside, "SKILL.md"), SKILL, "utf8");

    let hasSymlink = false;
    try {
      symlinkSync(outside, join(repo, "escape-link"), "dir");
      hasSymlink = true;
    } catch {
      // Ignore if symlink creation is disallowed by OS policy.
    }

    execFileSync("git", ["init", "-q"], { cwd: repo });
    execFileSync("git", ["-c", "core.symlinks=true", "add", "."], { cwd: repo });
    if (!hasSymlink) {
      const linkBlob = execFileSync("git", ["hash-object", "-w", "--stdin"], {
        cwd: repo,
        input: outside,
        encoding: "utf8",
      }).trim();
      execFileSync(
        "git",
        ["update-index", "--add", "--cacheinfo", `120000,${linkBlob},escape-link`],
        { cwd: repo },
      );
      hasSymlink = true;
    }
    execFileSync(
      "git",
      ["-c", "user.email=test@example.com", "-c", "user.name=Test", "commit", "-qm", "init"],
      { cwd: repo },
    );

    assert.throws(
      () =>
        importRepo({
          source: repo,
          allowLocal: true,
          subdir: "../outside",
          out,
        }),
      /--subdir points outside the cloned repository/,
    );

    if (hasSymlink) {
      assert.throws(
        () =>
          importRepo({
            source: repo,
            allowLocal: true,
            subdir: "escape-link",
            out,
          }),
        /--subdir (?:points outside the cloned repository|does not exist)/,
      );
    }
  } finally {
    rmSync(repo, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  }
});
