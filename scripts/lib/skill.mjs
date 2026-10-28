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
  `a an and any are as at be been being by can could do does for from has have how if in into is it its may might must not of on or should so than that the their them then there these they this those to use used user users using via was were what when where which while who will with without you your whenever even all explain difference between help write make work works working issue issues okay`.split(
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
  ["refactor", /(?:\b(?:refactor(?:s|ing)?|code smells?|technical debt|legacy|moderni[sz](?:e|ing|ation|es)?|seams?)\b|重构|代码异味|技术债|遗留系统|遗留代码|接缝)/i],
  ["testing", /(?:\b(?:test(?:s|ing|ed)?|tdd|coverage|fixtures?|assert(?:s|ing|ion|ions)?|regression(?:s)?)\b|测试|单测|回归测试|断言|覆盖率)/i],
  ["debugging", /(?:\b(?:debug(?:s|ging)?|diagnos(?:e|es|ing|is|tic)?|bugs?|flaky|stack traces?)\b|调试|诊断|排查|故障|堆栈)/i],
  ["architecture", /(?:\b(?:architect(?:s|ure|ural)?|modules?|interfaces?|abstractions?|layerings?|dependenc(?:y|ies)|deep modules?|anemic|timeouts?|retries|circuit breakers?|failure modes?)\b|架构|模块|接口|抽象|分层|解耦|深模块|超时|重试)/i],
  ["domain-modeling", /(?:\b(?:domains?|ddd|aggregates?|entit(?:y|ies)|value objects?|bounded contexts?|invariants?)\b|领域驱动|领域建模|聚合根|实体|值对象|限界上下文)/i],
  ["frontend", /(?:\b(?:frontend|ui|ux|react|css|html|components?|design systems?)\b|前端|界面|组件|样式|设计系统|无障碍)/i],
  ["docs", /(?:\b(?:document(?:s|ing|ation)?|docs?|readmes?|specs?|writing|proposals?|memos?|openapi)\b|文档|接口文档|规范|说明|提案|备忘录)/i],
  ["deliverables", /(?:\b(?:slides?|decks?|presentations?|pptx|docx|xlsx|pdfs?|spreadsheets?)\b|幻灯片|演示文稿|电子表格|表格)/i],
  ["visual-art", /(?:\b(?:posters?|canvas|generative art|algorithmic art|p5\.js|illustrations?)\b|海报|画布|生成艺术|算法艺术|插画)/i],
  ["security", /(?:\b(?:secur(?:e|ity)|vulnerab(?:le|ility|ilities)?|threat models?|owasp|authenticat(?:e|ion)|authoriz(?:e|ation)|cves?|bola|bopla|bfla|idor|ssrf|jwt|oauth2?|passwords?|hmac|webhooks?|cryptograph(?:y|ic)|signatures?|traversal)\b|安全|漏洞|威胁建模|鉴权|认证|授权|注入|加密|越权|上传文件|密码|签名|令牌)/i],
  ["data", /(?:\b(?:sql|databases?|schemas?|etl|analytics|pipelines?|storages?|indexes|indexing|mvcc|transactions?|pagination|offset|keyset|deadlocks?|concurrency|orms?|columns?|tables?|foreign keys?|unique constraints?|comma-separated|jaywalking)\b|数据库|索引|查询|事务|存储|表结构|死锁|分页|并发|软删除|字段)/i],
  ["ops", /(?:\b(?:deploy(?:s|ment|ing)?|ci|cd|kubernetes|docker|incidents?|sre|monitors?|monitoring|release\s+pipelines?)\b|部署|运维|监控|容器|发布|告警)/i],
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

const NEGATIVE_CLAUSE_MARKER =
  /\b(?:do\s+not|don't|never)\s+(?:trigger|use|activate|apply|invoke|load)\b|\b(?:not\s+for\s+use\s+with|not\s+intended\s+for|skip\s+(?:it\s+)?when|defer\s+to)\b|(?:不要|切勿|严禁|不)(?:触发|用于|使用|适用)/i;

/**
 * Separate a skill description into positive trigger text and negative
 * anti-trigger / deferral clauses so that explicit boundary exclusions
 * ("DO NOT trigger for SQL, databases...") do not pollute positive matching.
 */
export function splitTriggerSurface(description) {
  const source = String(description ?? "");
  if (!source.trim()) return { positive: "", negative: "" };

  const positiveParts = [];
  const negativeParts = [];

  // Split by sentence/line boundaries first while keeping bullet lines separate.
  const segments = source
    .split(/(?<=[.!?。！？;\n])\s+|\r?\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  let inNegativeBlock = false;
  for (const segment of segments) {
    // A positive trigger header resets negative block state
    if (/^(?:trigger(?:\s+immediately|\s+when|\s+on)?|use\s+(?:this\s+skill\s+)?(?:when|for)|applies\s+to)\b/i.test(segment)) {
      inNegativeBlock = false;
    }

    const match = NEGATIVE_CLAUSE_MARKER.exec(segment);
    if (match) {
      const before = segment.slice(0, match.index).replace(/[\s—–-]+$/, "").trim();
      const after = segment.slice(match.index).trim();
      if (before) positiveParts.push(before);
      if (after) negativeParts.push(after);
      // If the segment ends with a colon (e.g. "DO NOT trigger for:"), subsequent bullet lines belong to negative
      if (/:$/.test(segment)) {
        inNegativeBlock = true;
      }
      continue;
    }

    if (inNegativeBlock && /^[-*•]/.test(segment)) {
      negativeParts.push(segment);
    } else {
      if (!/^[-*•]/.test(segment)) inNegativeBlock = false;
      positiveParts.push(segment);
    }
  }

  return {
    positive: positiveParts.join(" "),
    negative: negativeParts.join(" "),
  };
}

function extractRawTerms(text) {
  const source = String(text ?? "").toLowerCase();
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

export function descriptionTerms(description, { includeAllClauses = false } = {}) {
  if (includeAllClauses) return extractRawTerms(description);
  const { positive } = splitTriggerSurface(description);
  return extractRawTerms(positive);
}

export function negativeDescriptionTerms(description) {
  const { negative } = splitTriggerSurface(description);
  return extractRawTerms(negative);
}

function extractRawTags(text) {
  const tags = new Set();
  const source = String(text ?? "");
  for (const [tag, pattern] of DOMAIN_TAGS) {
    if (pattern.test(source)) tags.add(tag);
  }
  return tags;
}

export function domainTags(text, { includeAllClauses = false } = {}) {
  if (includeAllClauses) return extractRawTags(text);
  const { positive } = splitTriggerSurface(text);
  return extractRawTags(positive);
}

export function negativeDomainTags(text) {
  const { negative } = splitTriggerSurface(text);
  return extractRawTags(negative);
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
  const aTerms = a.terms ?? new Set();
  const bTerms = b.terms ?? new Set();
  const aTags = a.tags ?? new Set();
  const bTags = b.tags ?? new Set();

  const sharedTerms = [...aTerms].filter((term) => bTerms.has(term));
  const sharedTags = [...aTags].filter((tag) => bTags.has(tag));
  const termDice = dice(aTerms, bTerms);
  const rawTagJaccard = jaccard(aTags, bTags);
  // Prevent a single shared coarse domain tag from contributing the full 0.40
  // when lexical overlap is weak (< 0.18 Dice or fewer than 2 shared terms).
  const lexicalSupport =
    sharedTerms.length >= 2 && termDice >= 0.18
      ? 1
      : Math.min(1, (termDice / 0.18) * (sharedTerms.length / 2));
  const effectiveTagScore = rawTagJaccard * lexicalSupport;
  const rawScore = 0.6 * termDice + 0.4 * effectiveTagScore;

  // Orthogonality discount when one skill explicitly declares anti-triggers
  // targeting the other skill's positive trigger surface.
  const aNegTerms = a.negativeTerms ?? new Set();
  const bNegTerms = b.negativeTerms ?? new Set();
  const aNegTags = a.negativeTags ?? new Set();
  const bNegTags = b.negativeTags ?? new Set();

  const excludedTerms = [
    ...new Set([
      ...[...aNegTerms].filter((term) => bTerms.has(term)),
      ...[...bNegTerms].filter((term) => aTerms.has(term)),
    ]),
  ];
  const excludedTags = [
    ...new Set([
      ...[...aNegTags].filter((tag) => bTags.has(tag)),
      ...[...bNegTags].filter((tag) => aTags.has(tag)),
    ]),
  ];

  const orthogonalityDiscount = Math.min(
    0.55,
    excludedTags.length * 0.18 + excludedTerms.length * 0.07,
  );
  const finalScore = Number((rawScore * (1 - orthogonalityDiscount)).toFixed(3));

  return {
    score: finalScore,
    sharedTerms: sharedTerms.slice(0, 8),
    sharedTags,
    excludedTerms: excludedTerms.slice(0, 6),
    excludedTags,
  };
}

/**
 * Parse a trigger evaluation markdown document (`evals/*-trigger-cases.md`)
 * into structured cases (`activate`, `dormant`, `defer`).
 */
export function parseTriggerCases(markdown, fallbackSkill = null) {
  const text = String(markdown ?? "").replace(/\r\n/g, "\n");
  const skillMatch = text.match(/Manual evaluation set for `([a-z0-9-]+)`/i);
  const skill = skillMatch ? skillMatch[1] : fallbackSkill;

  const cases = [];
  let currentKind = null;
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (/^##\s+Should activate\b/i.test(line)) {
      currentKind = "activate";
      continue;
    }
    if (/^##\s+Should stay dormant\b/i.test(line)) {
      currentKind = "dormant";
      continue;
    }
    if (/^##\s+Should defer\b/i.test(line)) {
      currentKind = "defer";
      continue;
    }
    if (/^##\s+/.test(line)) {
      currentKind = null;
      continue;
    }
    if (!currentKind || !line.startsWith("|")) continue;

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 3 || !/^\d+$/.test(cells[0])) continue;

    const id = Number(cells[0]);
    const quotedMatch = cells[1].match(/^"([\s\S]*?)"/);
    const prompt = quotedMatch ? quotedMatch[1].trim() : cells[1].replace(/^"|"$/g, "").trim();
    const expectation = cells[2];

    cases.push({
      id,
      kind: currentKind,
      skill,
      prompt,
      expectation,
    });
  }

  return { skill, cases };
}

/**
 * Score how strongly a user prompt activates a skill record.
 * Combines Level-1 positive description terms/tags with Level-2 body scenario terms,
 * while penalizing matches against explicit negative anti-trigger surfaces.
 */
export function promptMatchScore(skill, prompt) {
  const pTerms = extractRawTerms(prompt);
  const pTags = extractRawTags(prompt);
  if (pTerms.size === 0 && pTags.size === 0) {
    return { score: 0, matchedTerms: [], matchedTags: [], blockedByAntiTrigger: false };
  }

  const sTerms = skill.terms ?? new Set();
  const sBodyTerms = skill.bodyTerms ?? new Set();
  const sTags = skill.tags ?? new Set();
  const sNegTerms = skill.negativeTerms ?? new Set();
  const sNegTags = skill.negativeTags ?? new Set();

  const matchedDescTerms = [...pTerms].filter((term) => sTerms.has(term));
  const matchedBodyTerms = [...pTerms].filter((term) => !sTerms.has(term) && sBodyTerms.has(term));
  const matchedTags = [...pTags].filter((tag) => sTags.has(tag));

  const negTermHits = [...pTerms].filter((term) => sNegTerms.has(term));
  const negTagHits = [...pTags].filter((tag) => sNegTags.has(tag) && !sTags.has(tag));
  const positiveStrength = matchedDescTerms.length + matchedTags.length * 2 + matchedBodyTerms.length * 0.5;
  const negativeStrength = negTermHits.length + negTagHits.length * 1.5;
  const blockedByAntiTrigger =
    negativeStrength > 0 && negativeStrength > positiveStrength;

  // Body-only lexical matches without description term or domain tag support are weak
  // (e.g. generic programming words like "type" or "array" appearing in a reference body).
  const bodyWeight = matchedDescTerms.length > 0 || matchedTags.length > 0 ? 0.5 : 0.15;
  const termRecall =
    pTerms.size > 0
      ? (matchedDescTerms.length + bodyWeight * matchedBodyTerms.length) / Math.min(pTerms.size, 6)
      : 0;
  const isCrossLingual = /[㐀-鿿]/.test(prompt) !== /[㐀-鿿]/.test(skill.description ?? "");
  const hasLexicalSupport =
    isCrossLingual || matchedDescTerms.length >= 1 || matchedBodyTerms.length >= 2;
  const tagDamping = hasLexicalSupport ? 1 : 0.35;
  const tagSignal = matchedTags.length > 0 ? Math.min(1, matchedTags.length * 0.65) * tagDamping : 0;
  const raw = Math.min(1, 0.55 * Math.min(1, termRecall) + 0.45 * tagSignal);
  const penalty = blockedByAntiTrigger
    ? 0.75
    : matchedTags.length > 0 && matchedDescTerms.length > 0
      ? 0
      : Math.min(0.35, negTagHits.length * 0.15 + negTermHits.length * 0.08);

  return {
    score: Number(Math.max(0, raw * (1 - penalty)).toFixed(3)),
    matchedTerms: [...matchedDescTerms, ...matchedBodyTerms].slice(0, 8),
    matchedTags,
    blockedByAntiTrigger,
  };
}

/**
 * Evaluate a set of skills against parsed trigger benchmark suites (`evals/*-trigger-cases.md`).
 */
export function evaluateTriggerCorpus(
  skills,
  suites,
  { activateFloor = 0.2, dormantCeiling = 0.25 } = {},
) {
  const byName = new Map(skills.map((skill) => [skill.name, skill]));
  const failures = [];
  let totalCases = 0;

  for (const suite of suites) {
    const owner = byName.get(suite.skill);
    if (!owner) continue;

    for (const testCase of suite.cases) {
      totalCases += 1;
      const ownerResult = promptMatchScore(owner, testCase.prompt);

      if (testCase.kind === "activate" && ownerResult.score < activateFloor) {
        failures.push({
          skill: suite.skill,
          caseId: testCase.id,
          kind: "under-trigger",
          prompt: testCase.prompt,
          score: ownerResult.score,
          message: `activate #${testCase.id} scored ${ownerResult.score} (< ${activateFloor}) on ${suite.skill}`,
        });
      } else if (testCase.kind === "dormant" && ownerResult.score >= dormantCeiling) {
        failures.push({
          skill: suite.skill,
          caseId: testCase.id,
          kind: "over-trigger",
          prompt: testCase.prompt,
          score: ownerResult.score,
          message: `dormant #${testCase.id} scored ${ownerResult.score} (>= ${dormantCeiling}) on ${suite.skill}`,
        });
      }
    }
  }

  return { totalCases, failures };
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
    negativeTerms: negativeDescriptionTerms(description),
    bodyTerms: extractRawTerms(withoutFences),
    tags: domainTags(description),
    negativeTags: negativeDomainTags(description),
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
