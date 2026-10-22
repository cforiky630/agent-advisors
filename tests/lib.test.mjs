import assert from "node:assert/strict";
import test from "node:test";

import {
  countLines,
  descriptionTerms,
  domainTags,
  estimateTokens,
  findOverbroad,
  overlapScore,
  parseFrontmatter,
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
