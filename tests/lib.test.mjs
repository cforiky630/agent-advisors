import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  countLines,
  descriptionTerms,
  domainTags,
  estimateTokens,
  evaluateTriggerCorpus,
  findExecutableSurface,
  findOverbroad,
  negativeDescriptionTerms,
  negativeDomainTags,
  overlapScore,
  parseFrontmatter,
  parseTriggerCases,
  readSkill,
  slugify,
  splitTriggerSurface,
  skillContentHash,
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

test("separates positive trigger clauses from negative anti-trigger clauses in English and Chinese", () => {
  const enDesc =
    "Frontend React component and CSS layout advisor. Use for accessible UI components. Do not trigger for SQL queries, database schemas, or backend migrations.";
  const splitEn = splitTriggerSurface(enDesc);
  assert.match(splitEn.positive, /Frontend React component/);
  assert.match(splitEn.negative, /SQL queries/);

  const posTerms = descriptionTerms(enDesc);
  const negTerms = negativeDescriptionTerms(enDesc);
  const posTags = domainTags(enDesc);
  const negTags = negativeDomainTags(enDesc);

  assert.ok(posTerms.has("react"));
  assert.equal(posTerms.has("sql"), false);
  assert.equal(posTerms.has("database"), false);
  assert.ok(negTerms.has("sql"));
  assert.ok(negTerms.has("database"));
  assert.ok(posTags.has("frontend"));
  assert.equal(posTags.has("data"), false);
  assert.ok(negTags.has("data"));

  const zhDesc = "前端组件与界面样式顾问。用于 React 组件设计。不适用于数据库查询与 SQL 索引优化。";
  assert.ok(domainTags(zhDesc).has("frontend"));
  assert.equal(domainTags(zhDesc).has("data"), false);
  assert.ok(negativeDomainTags(zhDesc).has("data"));
});

test("applies orthogonality discount when skills explicitly exclude each other via anti-triggers", () => {
  const withoutExclusionA = {
    terms: descriptionTerms("Design architecture for service endpoints and APIs"),
    tags: domainTags("Design architecture for service endpoints and APIs"),
  };
  const withoutExclusionB = {
    terms: descriptionTerms("Design architecture for database endpoints and SQL queries"),
    tags: domainTags("Design architecture for database endpoints and SQL queries"),
  };
  const rawResult = overlapScore(withoutExclusionA, withoutExclusionB);

  const withExclusionA = {
    ...withoutExclusionA,
    negativeTerms: negativeDescriptionTerms(
      "Design architecture for service endpoints. Do not trigger for database endpoints or SQL queries.",
    ),
    negativeTags: negativeDomainTags(
      "Design architecture for service endpoints. Do not trigger for database endpoints or SQL queries.",
    ),
  };
  const discountedResult = overlapScore(withExclusionA, withoutExclusionB);

  assert.ok(
    discountedResult.score < rawResult.score,
    `expected discounted score (${discountedResult.score}) < raw score (${rawResult.score})`,
  );
  assert.ok(discountedResult.excludedTags.includes("data"));
  assert.ok(discountedResult.excludedTerms.includes("database"));
});

test("evaluates all 57 trigger benchmark cases in evals/ with zero activation or dormancy failures", () => {
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
  const skills = [
    readSkill(join(repoRoot, "skills", "software-design-advisor")),
    readSkill(join(repoRoot, "skills", "api-security-advisor")),
    readSkill(join(repoRoot, "skills", "data-storage-advisor")),
  ];
  const suites = [
    parseTriggerCases(readFileSync(join(repoRoot, "evals", "trigger-cases.md"), "utf8"), "software-design-advisor"),
    parseTriggerCases(readFileSync(join(repoRoot, "evals", "api-security-trigger-cases.md"), "utf8"), "api-security-advisor"),
    parseTriggerCases(readFileSync(join(repoRoot, "evals", "data-storage-trigger-cases.md"), "utf8"), "data-storage-advisor"),
  ];

  const { totalCases, checkedCases, manualCases, failures } = evaluateTriggerCorpus(skills, suites);
  assert.equal(totalCases, 57);
  assert.equal(checkedCases, 48);
  assert.equal(manualCases.length, 9);
  assert.ok(manualCases.every((item) => item.kind === "defer"));
  assert.deepEqual(failures, []);
});

test("trigger evaluation fails missing skills, empty suites and unknown kinds; deferral stays manual", () => {
  assert.equal(evaluateTriggerCorpus([], [{ skill: "missing", cases: [] }]).failures[0].kind, "missing-skill");
  const skills = [{ name: "demo" }];
  assert.equal(evaluateTriggerCorpus(skills, [{ skill: "demo", cases: [] }]).failures[0].kind, "empty-suite");
  const result = evaluateTriggerCorpus(skills, [{ skill: "demo", cases: [
    { kind: "defer", prompt: "Follow the testing workflow", expectation: "defer" },
    { kind: "typo", prompt: "Unknown" },
  ] }]);
  assert.equal(result.checkedCases, 0);
  assert.equal(result.manualCases.length, 1);
  assert.equal(result.failures[0].kind, "unknown-case");
});

test("skill content hash covers nested references, binary assets, file names and additions", () => {
  const root = mkdtempSync(join(tmpdir(), "aa-hash-"));
  try {
    mkdirSync(join(root, "references", "nested"), { recursive: true });
    writeFileSync(join(root, "SKILL.md"), "# Demo\r\n");
    const initial = skillContentHash(root);
    writeFileSync(join(root, "SKILL.md"), "# Demo\n");
    assert.equal(skillContentHash(root), initial);
    const file = join(root, "references", "nested", "rules.md");
    writeFileSync(file, "Always retry.\n");
    const withRules = skillContentHash(root);
    assert.notEqual(withRules, initial);
    writeFileSync(file, "Never retry.\n");
    assert.notEqual(skillContentHash(root), withRules);
    const changed = skillContentHash(root);
    writeFileSync(join(root, "asset.bin"), Buffer.from([0, 255, 128]));
    assert.notEqual(skillContentHash(root), changed);
    const beforeRename = skillContentHash(root);
    renameSync(file, join(root, "references", "nested", "renamed.md"));
    assert.notEqual(skillContentHash(root), beforeRename);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("skill hashing fails explicitly on resource limits rather than returning a partial identity", () => {
  const root = mkdtempSync(join(tmpdir(), "aa-hash-limit-"));
  try {
    writeFileSync(join(root, "SKILL.md"), "# Demo\n");
    assert.throws(() => skillContentHash(root, { maxFileBytes: 1 }), /byte limit/);
    assert.throws(() => skillContentHash(root, { maxTotalBytes: 1 }), /byte limit/);
    assert.throws(() => skillContentHash(root, { maxFiles: 0 }), /entry limit/);
    mkdirSync(join(root, "references"));
    assert.throws(() => skillContentHash(root, { maxDepth: 0 }), /depth limit/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});


