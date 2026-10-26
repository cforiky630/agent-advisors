import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  countLines,
  descriptionTerms,
  domainTags,
  estimateTokens,
  findExecutableSurface,
  findOverbroad,
  overlapScore,
  parseFrontmatter,
  readSkill,
  slugify,
} from "../scripts/lib/skill.mjs";

test("parses frontmatter with CRLF line endings", () => {
  const text = "---\r\nname: demo\r\ndescription: A demo skill\r\nlicense: MIT\r\n---\r\n# Body\r\n";
  const { found, meta, body } = parseFrontmatter(text);
  assert.equal(found, true);
  assert.equal(meta.name, "demo");
  assert.equal(meta.description, "A demo skill");
  assert.match(body, /# Body/);
});

test("reports missing frontmatter instead of guessing", () => {
  const { found, meta } = parseFrontmatter("# Just a document\n");
  assert.equal(found, false);
  assert.deepEqual(meta, {});
});

test("counts lines without a trailing newline bonus", () => {
  assert.equal(countLines("a\nb\nc\n"), 3);
  assert.equal(countLines("a\r\nb"), 2);
  assert.equal(countLines(""), 0);
});

test("estimates CJK and Latin tokens differently", () => {
  assert.equal(estimateTokens("技能审计工具"), 6);
  assert.equal(estimateTokens("abcdefgh"), 2);
});

test("extracts domain tags without matching bare 'design'", () => {
  assert.ok(domainTags("Refactor this legacy module").has("refactor"));
  assert.ok(domainTags("Refactor this legacy module").has("architecture"));
  assert.equal(domainTags("A beautiful design studio poster").has("architecture"), false);
});

test("scores identical trigger surfaces higher than unrelated ones", () => {
  const a = { terms: descriptionTerms("review code architecture module interface"), tags: domainTags("review code architecture module interface") };
  const b = { terms: descriptionTerms("review code architecture module interface"), tags: domainTags("review code architecture module interface") };
  const c = { terms: descriptionTerms("generate slides presentation deck"), tags: domainTags("generate slides presentation deck") };
  assert.ok(overlapScore(a, b).score > 0.9);
  assert.equal(overlapScore(a, c).score, 0);
});

test("detects over-broad trigger wording", () => {
  assert.deepEqual(findOverbroad("Use whenever the user mentions anything about code."), ["whenever", "anything"]);
  assert.deepEqual(findOverbroad("Review a pull request diff."), []);
});

test("slugifies repository names", () => {
  assert.equal(slugify("My Skills!"), "my-skills");
});

test("parses multiline YAML block scalars and strips inline comments", () => {
  const folded = [
    "---",
    "name: folded-skill # inline comment",
    "description: >",
    "  First line of a folded",
    "  multiline description.",
    "license: MIT # SPDX",
    "---",
    "# Body",
  ].join("\n");
  const parsedFolded = parseFrontmatter(folded);
  assert.equal(parsedFolded.found, true);
  assert.equal(parsedFolded.meta.name, "folded-skill");
  assert.equal(parsedFolded.meta.description, "First line of a folded multiline description.");
  assert.equal(parsedFolded.meta.license, "MIT");

  const literal = [
    "---",
    "name: literal-skill",
    "description: |",
    "  Line one",
    "  Line two",
    "---",
    "# Body",
  ].join("\n");
  const parsedLiteral = parseFrontmatter(literal);
  assert.equal(parsedLiteral.meta.description, "Line one\nLine two");
});

test("stems 4-letter plurals without mangling ss/us/is/os or tech names", () => {
  const terms = descriptionTerms("Relentless postgres and redis bugs in apis and serverless status");
  assert.ok(terms.has("relentless"));
  assert.equal(terms.has("relentles"), false);
  assert.ok(terms.has("postgres"));
  assert.ok(terms.has("redis"));
  assert.ok(terms.has("serverless"));
  assert.ok(terms.has("status"));
  assert.ok(terms.has("bug"));
  assert.ok(terms.has("api"));
});

test("requires full references/<file> path when checking unlinkedReferences and scans references for scripts", () => {
  const dir = mkdtempSync(join(tmpdir(), "aa-skill-ref-"));
  try {
    mkdirSync(join(dir, "references"), { recursive: true });
    writeFileSync(
      join(dir, "SKILL.md"),
      [
        "---",
        "name: demo-skill",
        "description: Demo skill description.",
        "license: MIT",
        "---",
        "See `references/implementing-ddd.md` for details.",
      ].join("\n"),
      "utf8",
    );
    writeFileSync(join(dir, "references", "implementing-ddd.md"), "# Implementing DDD\n", "utf8");
    writeFileSync(join(dir, "references", "ddd.md"), "# DDD\n", "utf8");
    writeFileSync(join(dir, "references", "sneaky.sh"), "#!/bin/sh\n", "utf8");
    writeFileSync(join(dir, "Makefile"), "all:\n", "utf8");

    const record = readSkill(dir);
    assert.deepEqual(record.unlinkedReferences, ["ddd.md"]);
    assert.deepEqual(findExecutableSurface(dir), ["references/sneaky.sh"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("detects missing non-references/ skill assets while ignoring fenced code blocks", () => {
  const dir = mkdtempSync(join(tmpdir(), "aa-skill-assets-"));
  try {
    mkdirSync(join(dir, "scripts"), { recursive: true });
    writeFileSync(join(dir, "scripts", "existing.py"), "# exists\n", "utf8");
    writeFileSync(
      join(dir, "SKILL.md"),
      [
        "---",
        "name: asset-skill",
        "description: Skill referencing relative assets.",
        "license: MIT",
        "---",
        "Read `agents/grader.md` and run `scripts/run_eval.py` or `scripts/existing.py`.",
        "Generate the report with `eval-viewer/generate_review.py` using template `assets/eval_review.html`.",
        "",
        "```bash",
        "python scripts/ignored_in_fence.py --template assets/ignored_template.html",
        "```",
      ].join("\n"),
      "utf8",
    );

    const record = readSkill(dir);
    assert.deepEqual(
      record.missingReferences.sort(),
      [
        "agents/grader.md",
        "assets/eval_review.html",
        "eval-viewer/generate_review.py",
        "scripts/run_eval.py",
      ],
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("tokenizes CJK bigrams and extracts bilingual domain tags for overlap scoring", () => {
  const descA = "设计并产出接口文档 当用户提到接口文档 API 文档时使用";
  const descB = "接口文档设计 生成 REST API 文档与 OpenAPI 规范";
  const a = { terms: descriptionTerms(descA), tags: domainTags(descA) };
  const b = { terms: descriptionTerms(descB), tags: domainTags(descB) };

  for (const term of ["接口", "文档", "设计", "api"]) {
    assert.ok(a.terms.has(term), `expected a.terms to contain ${term}`);
    assert.ok(b.terms.has(term), `expected b.terms to contain ${term}`);
  }
  assert.ok(a.tags.has("docs") && b.tags.has("docs"));
  assert.ok(a.tags.has("architecture") && b.tags.has("architecture"));

  const overlap = overlapScore(a, b);
  assert.ok(overlap.score > 0.65, `expected score > 0.65, got ${overlap.score}`);
});

test("dampens single-tag false positives when lexical overlap is weak", () => {
  const poster = {
    terms: descriptionTerms("Create visual canvas poster artwork and illustrations in pdf format"),
    tags: domainTags("Create visual canvas poster artwork and illustrations in pdf format"),
  };
  const docx = {
    terms: descriptionTerms("Edit Word docx files tracked changes comments and pdf exports"),
    tags: domainTags("Edit Word docx files tracked changes comments and pdf exports"),
  };
  const result = overlapScore(poster, docx);
  assert.ok(result.sharedTags.includes("deliverables"));
  assert.ok(result.score < 0.4, `expected damped score < 0.4, got ${result.score}`);
});

