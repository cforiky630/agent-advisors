/**
 * Shared helpers for reading and comparing agent skills.
 *
 * Everything here works on plain text and filesystem paths; nothing loads a
 * skill or executes anything it contains.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
const CJK = /[㐀-鿿豈-﫿぀-ヿ가-힯]/g;

const STOPWORDS = new Set(
  `a an and any are as at be been being by can could do does for from has have how if in into is it its may might must not of on or should so than that the their them then there these they this those to use used user users using via was were what when where which while who will with without you your whenever even all`.split(
    /\s+/,
  ),
);

const CJK_STOP_CHARS = /[的了和与或在当时中及并把将对为是有从向到被让给由按于之]/g;
const CJK_STOP_BIGRAMS = new Set([
  "使用",
  "用于",
  "用户",
  "提到",
  "进行",
  "通过",
  "可以",
  "需要",
  "支持",
  "能够",
  "或者",
  "以及",
  "任何",
  "所有",
  "一个",
  "这个",
  "相关",
  "包括",
  "生成",
  "创建",
  "产出",
]);

const DOMAIN_TAGS = [
  ["review", /(?:\b(?:review(?:s|ing)?|audit(?:s|ing)?|inspection(?:s)?|checklist(?:s)?)\b|审查|审计|评审|走查|检查清单)/i],
  ["refactor", /(?:\b(?:refactor(?:s|ing)?|code smells?|technical debt|legacy|moderni[sz](?:e|ing|ation|es)?)\b|重构|代码异味|技术债|遗留系统|遗留代码)/i],
  ["testing", /(?:\b(?:test(?:s|ing|ed)?|tdd|coverage|fixtures?|assert(?:s|ing|ion|ions)?|regression(?:s)?)\b|测试|单测|回归测试|断言|覆盖率)/i],
  ["debugging", /(?:\b(?:debug(?:s|ging)?|diagnos(?:e|es|ing|is|tic)?|bugs?|flaky|stack traces?)\b|调试|诊断|排查|故障|堆栈)/i],
  ["architecture", /(?:\b(?:architect(?:s|ure|ural)?|modules?|interfaces?|abstractions?|layerings?|dependenc(?:y|ies)|deep modules?)\b|架构|模块|接口|抽象|分层|解耦|深模块)/i],
  ["domain-modeling", /(?:\b(?:domains?|ddd|aggregates?|entit(?:y|ies)|value objects?|bounded contexts?)\b|领域驱动|领域建模|聚合根|实体|值对象|限界上下文)/i],
  ["frontend", /(?:\b(?:frontend|ui|ux|react|css|html|components?|design systems?)\b|前端|界面|组件|样式|设计系统|无障碍)/i],
  ["docs", /(?:\b(?:document(?:s|ing|ation)?|docs?|readmes?|specs?|writing|proposals?|memos?|openapi)\b|文档|接口文档|规范|说明|提案|备忘录)/i],
  ["deliverables", /(?:\b(?:slides?|decks?|presentations?|pptx|docx|xlsx|pdfs?|spreadsheets?)\b|幻灯片|演示文稿|电子表格|表格)/i],
  ["visual-art", /(?:\b(?:posters?|canvas|generative art|algorithmic art|p5\.js|illustrations?)\b|海报|画布|生成艺术|算法艺术|插画)/i],
  ["security", /(?:\b(?:secur(?:e|ity)|vulnerab(?:le|ility|ilities)?|threat models?|owasp|authenticat(?:e|ion)|authoriz(?:e|ation)|cves?|bola|idor|ssrf)\b|安全|漏洞|威胁建模|鉴权|认证|授权|注入|加密|越权)/i],
  ["data", /(?:\b(?:sql|databases?|schemas?|etl|analytics|pipelines?|storages?|indexes|indexing|mvcc|transactions?)\b|数据库|索引|查询|事务|存储|表结构|死锁)/i],
  ["ops", /(?:\b(?:deploy(?:s|ment|ing)?|ci|cd|kubernetes|docker|incidents?|sre|monitors?|monitoring|releases?)\b|部署|运维|监控|容器|发布|告警)/i],
  ["research", /(?:\b(?:research(?:es|ing)?|investigat(?:e|es|ing|ion)?|sources?|evidences?|citations?)\b|调研|检索|研究|文献|引用)/i],
  ["planning", /(?:\b(?:plans?|planning|tickets?|backlogs?|roadmaps?|estimates?|estimating|estimation|breakdowns?)\b|规划|计划|排期|拆解|路线图|估算)/i],
];

const SCRIPT_EXTENSIONS = new Set([
  ".sh",
  ".bash",
  ".zsh",
  ".ps1",
  ".bat",
  ".cmd",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".py",
  ".rb",
  ".pl",
  ".php",
  ".jar",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
]);

export const OVERBROAD_PATTERNS = [
  [/\bwhenever\b/i, "whenever"],
  [/\beven when\b/i, "even when"],
  [/\bany (?:task|request|code|project)\b/i, "any task/request"],
  [/\ball (?:tasks|requests|code)\b/i, "all tasks"],
  [/\banything\b/i, "anything"],
];

/** Parse leading YAML-ish frontmatter without a YAML dependency. */
export function parseFrontmatter(text) {
  const source = String(text ?? "").replace(/^\uFEFF/, "");
  const match = source.match(FRONTMATTER);
  if (!match) return { found: false, meta: {}, body: source };
  const meta = {};
  const lines = match[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    if (!raw.trim() || raw.trimStart().startsWith("#") || /^[ \t]/.test(raw)) continue;
    const colon = raw.indexOf(":");
    if (colon <= 0) continue;
    const key = raw.slice(0, colon).trim();
    let value = raw.slice(colon + 1).trim();
    const isQuoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (isQuoted) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }

    const isBlockScalar = !isQuoted && /^[|>][-+]?$/.test(value);
    const hasIndentedContinuation =
      !isQuoted &&
      i + 1 < lines.length &&
      /^[ \t]+\S/.test(lines[i + 1]) &&
      !lines[i + 1].trimStart().startsWith("#");

    if (isBlockScalar || (!isQuoted && value === "") || hasIndentedContinuation) {
      const indicator = isBlockScalar ? value[0] : "";
      const blockLines = [];
      while (i + 1 < lines.length) {
        const next = lines[i + 1];
        if (/^[ \t]+\S/.test(next)) {
          blockLines.push(next);
          i += 1;
          continue;
        }
        if (!next.trim()) {
          let lookahead = i + 2;
          while (lookahead < lines.length && !lines[lookahead].trim()) lookahead += 1;
          if (lookahead < lines.length && /^[ \t]+\S/.test(lines[lookahead])) {
            blockLines.push("");
            i += 1;
            continue;
          }
        }
        break;
      }
      if (indicator === "|") {
        const indents = blockLines
          .filter((line) => line.trim().length > 0)
          .map((line) => line.match(/^[ \t]*/)[0].length);
        const minIndent = indents.length > 0 ? Math.min(...indents) : 0;
        value = blockLines.map((line) => (line ? line.slice(minIndent) : "")).join("\n").trim();
      } else if (indicator === ">") {
        value = blockLines
          .map((line) => line.trim())
          .filter(Boolean)
          .join(" ");
      } else if (blockLines.length > 0) {
        const continued = blockLines
          .map((line) => line.replace(/\s+#.*$/, "").trim())
          .filter((line) => line && !line.startsWith("#"))
          .join(" ");
        value = value ? `${value} ${continued}` : continued;
      }
    }
    meta[key] = value;
  }
  return { found: true, meta, body: source.slice(match[0].length) };
}

export function countLines(text) {
  const normalized = String(text ?? "").replace(/\r\n/g, "\n").replace(/\n$/, "");
  return normalized ? normalized.split("\n").length : 0;
}

/** Rough token estimate: CJK characters count as one, other text as chars/4. */
export function estimateTokens(text) {
  const value = String(text ?? "");
  const cjk = value.match(CJK)?.length ?? 0;
  const rest = value.replace(CJK, "").length;
  return cjk + Math.ceil(rest / 4);
}

export function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

const NON_PLURAL_ENDINGS = /(?:ss|us|is|os)$/;
const NON_PLURAL_WORDS = new Set([
  "postgres",
  "redis",
  "nextjs",
  "nodejs",
  "nestjs",
  "nuxtjs",
  "reactjs",
  "vuejs",
  "serverless",
  "kubernetes",
  "prometheus",
  "jenkins",
  "alias",
  "canvas",
  "series",
  "species",
  "lens",
  "cors",
]);
const FOUR_LETTER_PLURALS = new Set([
  "apis",
  "bugs",
  "docs",
  "logs",
  "jobs",
  "keys",
  "urls",
  "rows",
  "tags",
  "runs",
  "apps",
  "pdfs",
  "cves",
  "sdks",
  "clis",
  "orms",
  "jwts",
  "rpcs",
  "slos",
  "slas",
]);

function stemTerm(word) {
  if (!word.endsWith("s") || NON_PLURAL_WORDS.has(word)) {
    return word;
  }
  if (FOUR_LETTER_PLURALS.has(word)) {
    return word.slice(0, -1);
  }
  if (NON_PLURAL_ENDINGS.test(word)) {
    return word;
  }
  if (word.length > 4) {
    return word.slice(0, -1);
  }
  return word;
}

export function descriptionTerms(description) {
  const source = String(description ?? "").toLowerCase();
  const terms = new Set(
    source
      .replace(CJK, " ")
      .replace(/[`*_#>/\\()[\]{},.:;!?'"]/g, " ")
      .split(/\s+/)
      .map((word) => word.replace(/^[-+]+|[-+]+$/g, ""))
      .filter((word) => word.length >= 3 && !STOPWORDS.has(word))
      .map(stemTerm)
      .filter((word) => word.length >= 3),
  );

  // Extract CJK character bigrams so Chinese/Japanese/Korean descriptions
  // without whitespace delimiters participate in lexical similarity.
  const cjkSegments = source.replace(CJK_STOP_CHARS, " ").match(/[㐀-鿿]{2,}/g) ?? [];
  for (const segment of cjkSegments) {
    for (let i = 0; i < segment.length - 1; i += 1) {
      const bigram = segment.slice(i, i + 2);
      if (!CJK_STOP_BIGRAMS.has(bigram)) {
        terms.add(bigram);
      }
    }
  }

  return terms;
}

export function domainTags(text) {
  const tags = new Set();
  for (const [tag, pattern] of DOMAIN_TAGS) {
    if (pattern.test(String(text ?? ""))) tags.add(tag);
  }
  return tags;
}

function dice(a, b) {
  const total = a.size + b.size;
  if (total === 0) return 0;
  let shared = 0;
  for (const item of a) if (b.has(item)) shared += 1;
  return (2 * shared) / total;
}

function jaccard(a, b) {
  const union = new Set([...a, ...b]).size;
  if (union === 0) return 0;
  let shared = 0;
  for (const item of a) if (b.has(item)) shared += 1;
  return shared / union;
}

/** Compare two skills' trigger surfaces. Returns a score in [0, 1]. */
export function overlapScore(a, b) {
  const sharedTerms = [...a.terms].filter((term) => b.terms.has(term));
  const sharedTags = [...a.tags].filter((tag) => b.tags.has(tag));
  const termDice = dice(a.terms, b.terms);
  const rawTagJaccard = jaccard(a.tags, b.tags);
  // Prevent a single shared coarse domain tag from contributing the full 0.40
  // when lexical overlap is weak (< 0.18 Dice or fewer than 2 shared terms).
  const lexicalSupport =
    sharedTerms.length >= 2 && termDice >= 0.18
      ? 1
      : Math.min(1, (termDice / 0.18) * (sharedTerms.length / 2));
  const effectiveTagScore = rawTagJaccard * lexicalSupport;
  return {
    score: Number((0.6 * termDice + 0.4 * effectiveTagScore).toFixed(3)),
    sharedTerms: sharedTerms.slice(0, 8),
    sharedTags,
  };
}

export function findOverbroad(description) {
  const hits = [];
  for (const [pattern, label] of OVERBROAD_PATTERNS) {
    if (pattern.test(description)) hits.push(label);
  }
  if (estimateTokens(description) > 180) hits.push("very long description");
  return hits;
}

/** Collect files in a skill directory that would run outside the model. */
export function findExecutableSurface(skillDir) {
  const found = [];
  const walk = (dir, depth) => {
    if (depth > 4) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, depth + 1);
        continue;
      }
      let isFile = entry.isFile();
      if (entry.isSymbolicLink()) {
        try {
          isFile = statSync(full).isFile();
        } catch {
          isFile = false;
        }
      }
      if (isFile) {
        const dotIndex = entry.name.lastIndexOf(".");
        const extension = dotIndex > 0 ? entry.name.slice(dotIndex).toLowerCase() : "";
        if (SCRIPT_EXTENSIONS.has(extension)) {
          found.push(relative(skillDir, full).split(sep).join("/"));
        }
      }
    }
  };
  walk(skillDir, 0);
  return found;
}

/** Read a skill directory into a comparable record. */
export function readSkill(skillDir, { scope = "unknown", agent = "unknown" } = {}) {
  const skillMd = join(skillDir, "SKILL.md");
  const text = readFileSync(skillMd, "utf8");
  const { found, meta, body } = parseFrontmatter(text);
  const name = meta.name || basename(skillDir);
  const description = meta.description || "";

  const referencesDir = join(skillDir, "references");
  const referenceFiles = existsSync(referencesDir)
    ? readdirSync(referencesDir).filter((file) => file.endsWith(".md")).sort()
    : [];
  const unlinkedReferences = referenceFiles.filter((file) => !body.includes(`references/${file}`));
  const missingRefSet = new Set(
    [...body.matchAll(/references\/([A-Za-z0-9._/-]+\.md)/g)]
      .map((match) => match[1])
      .filter((file) => !existsSync(join(referencesDir, file))),
  );

  // Also scan non-fenced skill text for relative asset paths under standard skill
  // subdirectories (agents/, scripts/, assets/, eval-viewer/, templates/, examples/, resources/).
  const withoutFences = body.replace(/```[\s\S]*?```/g, "");
  const assetPattern =
    /(?:^|[\s`(["'])(?:\/|\.\/)?((?:agents|scripts|assets|eval-viewer|templates|examples|resources)\/[A-Za-z0-9._/-]+\.(?:md|py|js|mjs|cjs|ts|sh|bash|ps1|html|css|json|ya?ml|toml|txt))(?=$|[\s`)\]"',.:;])/gm;
  for (const match of withoutFences.matchAll(assetPattern)) {
    const relAsset = match[1];
    if (relAsset.includes("..") || !existsSync(join(skillDir, relAsset))) {
      missingRefSet.add(relAsset);
    }
  }
  const missingReferences = [...missingRefSet];

  return {
    name,
    skillDir,
    skillMd,
    scope,
    agent,
    frontmatter: found,
    description,
    descriptionChars: description.length,
    descriptionTokens: estimateTokens(description),
    lineCount: countLines(text),
    hash: sha256(text),
    license: meta.license ?? "",
    references: referenceFiles,
    unlinkedReferences,
    missingReferences,
    executableFiles: findExecutableSurface(skillDir),
    terms: descriptionTerms(description),
    tags: domainTags(description),
    overbroad: findOverbroad(description),
    contentHash: sha256(text.replace(/\r\n/g, "\n").trim()),
  };
}

/**
 * Validate a skill record.
 *
 * strict is for this repository's own authoring rules. Installed third-party
 * skills are only held to correctness (readable frontmatter, resolvable
 * references); stylistic budgets are reported as notes instead.
 */
export function structuralIssues(record, { strict = false } = {}) {
  const issues = [];
  const add = (level, message) => issues.push({ level, message });
  const authoring = strict ? "warn" : "info";

  if (!record.frontmatter) add("error", "missing YAML frontmatter");
  if (!record.description) add("error", "frontmatter is missing 'description'");
  if (record.descriptionChars > 1200) {
    add(authoring, `description is ${record.descriptionChars} chars (max 1200)`);
  }
  if (record.lineCount > 150) add(authoring, `${record.lineCount} lines (max 150)`);
  if (record.unlinkedReferences.length > 0) {
    add("info", `unlinked references: ${record.unlinkedReferences.join(", ")}`);
  }
  if (record.missingReferences.length > 0) {
    add(strict ? "error" : "warn", `linked references do not exist: ${record.missingReferences.join(", ")}`);
  }
  if (record.executableFiles.length > 0) {
    add("info", `contains executable files: ${record.executableFiles.join(", ")}`);
  }
  if (record.overbroad.length > 0) {
    add("info", `broad trigger wording: ${record.overbroad.join(", ")}`);
  }
  return issues;
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "imported";
}
