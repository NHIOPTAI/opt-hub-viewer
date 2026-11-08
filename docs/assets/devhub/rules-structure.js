// OPT.AI Developer Hub -- the Boolean structure of a rule set and its COMPLETE alternatives (pure, no DOM access).
//
// An exact port of the OPT.AI guide's structure logic (OPT-AI repository, read-only reference):
//   services/preference_guidance/rule_structure.py  -- _group_expr, expression_of, _dnf, structure_of, Expr.text / to_json
//   services/preference_guidance/rules_model.py     -- the field parsing (_s), RuleSet.group_logic, shape_of, _percent
// The Rules data encode: RGroupLog = the logic BETWEEN the groups of a rule set (the FIRST group's value counts);
// SubGroupNo "OR-n" = an OR bracket of alternative groups inside an AND set; RLogic = the logic between the rules of one
// group. Every complete alternative is a conjunction of conditions (rules) that must ALL hold. Nothing is evaluated here.
// Verified against the Python reference: tests/devhub (199 recorded rule sets, 9 synthetic structures, edge vectors).
// Deliberately ported AS IS (not "fixed"): a range such as `84XX` is HS_EXCLUSION (only `99XX`, `9999XX`, `99XXXX` and
// plain digits are change rules), and a one-group OR bracket whose group is itself OR-linked fails like the reference.

export const MAX_ALTERNATIVES = 64;

export const RuleShape = Object.freeze({
  NO_RESTRICTION: "NO_RESTRICTION",
  CHANGE_OF_CHAPTER: "CHANGE_OF_CHAPTER",
  CHANGE_OF_HEADING: "CHANGE_OF_HEADING",
  CHANGE_OF_SUBHEADING: "CHANGE_OF_SUBHEADING",
  HS_EXCLUSION: "HS_EXCLUSION",
  ONLY_FROM_HS: "ONLY_FROM_HS",
  VALUE_LIMIT: "VALUE_LIMIT",
  VALUE_SHARE: "VALUE_SHARE",
  VALUE_MINIMUM: "VALUE_MINIMUM",
  ABSOLUTE_VALUE: "ABSOLUTE_VALUE",
  WEIGHT_RULE: "WEIGHT_RULE",
  FIFTY_FIFTY: "FIFTY_FIFTY",
  DESCRIPTION: "DESCRIPTION",
  UNSUPPORTED: "UNSUPPORTED",
});

// rules_model.py: _PLACEHOLDER_HEADING, _PLACEHOLDER_SUBHEADING, _STATIC (the values are stripped, so `$` behaves alike)
const PLACEHOLDER_HEADING = /^99XX$/;
const PLACEHOLDER_SUBHEADING = /^(9999XX|99XXXX)$/;
const STATIC = /^[0-9]{2,10}$/;

/** A malformed Rules answer (rules_model.RulesAnswerInvalid). */
export class RulesAnswerInvalid extends Error {
  constructor(message) {
    super(message);
    this.name = "RulesAnswerInvalid";
  }
}

/** The reference raises here too (a StopIteration in expression_of): the structure cannot be determined. */
export class StructureUndetermined extends Error {
  constructor(message) {
    super(message);
    this.name = "StructureUndetermined";
  }
}

// ---- Python string semantics ----------------------------------------------------------------------------------------

// str.isspace() / str.strip(): the exact set of Python 3 whitespace code points (all in the BMP)
const PY_WHITESPACE = new Set([
  0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x1c, 0x1d, 0x1e, 0x1f, 0x20, 0x85, 0xa0, 0x1680,
  0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200a,
  0x2028, 0x2029, 0x202f, 0x205f, 0x3000,
]);
// float(str) strips only C whitespace plus the non-ASCII Unicode spaces (not U+001C..U+001F)
const FLOAT_WHITESPACE = new Set([...PY_WHITESPACE].filter((cp) => cp < 0x1c || cp > 0x1f));

function stripSet(text, set) {
  let start = 0;
  let end = text.length;
  while (start < end && set.has(text.charCodeAt(start))) start += 1;
  while (end > start && set.has(text.charCodeAt(end - 1))) end -= 1;
  return text.slice(start, end);
}

/** Python's str.strip() without argument (not String.prototype.trim: U+FEFF stays, U+001C..U+001F and U+0085 go). */
export function pyStrip(text) {
  return stripSet(String(text), PY_WHITESPACE);
}

function pyFloatRepr(n) {
  if (Number.isNaN(n)) return "nan";
  if (!Number.isFinite(n)) return n > 0 ? "inf" : "-inf";
  const abs = Math.abs(n);
  if (abs !== 0 && (abs < 1e-4 || abs >= 1e16)) {
    const [mantissa, exponent] = n.toExponential().split("e");
    const sign = exponent.startsWith("-") ? "-" : "+";
    const digits = exponent.replace(/^[+-]/, "").padStart(2, "0");
    return `${mantissa}e${sign}${digits}`;
  }
  return String(n);
}

function pyRepr(value) {
  if (typeof value === "string") {
    const quote = value.includes("'") && !value.includes('"') ? '"' : "'";
    const body = value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
    return quote + (quote === "'" ? body.replace(/'/g, "\\'") : body) + quote;
  }
  return pyStr(value);
}

/** Python's str() of a JSON value. Exact for strings, integers, booleans and null -- the Rules API delivers strings;
 *  a float such as 1.0 cannot be told from 1 after JSON.parse (the only, unavoidable, difference). */
export function pyStr(value) {
  if (value === null || value === undefined) return "None";
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "number") return Number.isInteger(value) ? BigInt(value).toString() : pyFloatRepr(value);
  if (Array.isArray(value)) return `[${value.map(pyRepr).join(", ")}]`;
  if (typeof value === "object") return `{${Object.entries(value).map(([k, v]) => `${pyRepr(k)}: ${pyRepr(v)}`).join(", ")}}`;
  return String(value);
}

/** rules_model._s: `"" if value is None else str(value).strip()` for mapping.get(key, ""). */
export function fieldOf(mapping, key) {
  const value = mapping !== null && typeof mapping === "object" && Object.prototype.hasOwnProperty.call(mapping, key) ? mapping[key] : "";
  return value === null || value === undefined ? "" : pyStrip(pyStr(value));
}

// Python float(): optional sign, digits with single underscores between them, optional fraction, optional exponent
const PY_FLOAT = /^[+-]?(?:(?:[0-9](?:_?[0-9])*)?\.[0-9](?:_?[0-9])*|[0-9](?:_?[0-9])*\.?)(?:[eE][+-]?[0-9](?:_?[0-9])*)?$/;
const PY_SPECIAL = /^([+-]?)(inf|infinity|nan)$/i;
const DECIMAL_DIGIT = /^\p{Nd}$/u;

/** The value of a Unicode decimal digit (general category Nd). Unicode encodes them in contiguous runs of ten (0..9),
 *  so the offset from the start of the run, modulo ten, is the digit. */
function decimalValueOf(codePoint) {
  if (!DECIMAL_DIGIT.test(String.fromCodePoint(codePoint))) return null;
  let start = codePoint;
  while (start > 0 && DECIMAL_DIGIT.test(String.fromCodePoint(start - 1))) start -= 1;
  return (codePoint - start) % 10;
}

/** Python's float(str) -- null where Python raises ValueError. Non-ASCII decimal digits count as digits (as in Python),
 *  any other non-ASCII character makes the text invalid. */
export function pyFloat(text) {
  const stripped = stripSet(String(text), FLOAT_WHITESPACE);
  let ascii = "";
  for (const ch of stripped) {
    const codePoint = ch.codePointAt(0);
    if (codePoint < 0x80) {
      ascii += ch;
      continue;
    }
    const digit = decimalValueOf(codePoint);
    if (digit === null) return null;
    ascii += String(digit);
  }
  const special = PY_SPECIAL.exec(ascii);
  if (special) {
    if (special[2].toLowerCase() === "nan") return Number.NaN;
    return special[1] === "-" ? -Infinity : Infinity;
  }
  if (!PY_FLOAT.test(ascii)) return null;
  return Number(ascii.replace(/_/g, ""));
}

/** rules_model._percent: float(value.replace(",", ".")) -- every comma becomes a dot; null when not a number. */
export function percentOf(value) {
  return pyFloat(String(value).split(",").join("."));
}

/** Python's code-point order for str comparison (sorted / groupby keys). */
function comparePy(a, b) {
  const ca = Array.from(a, (ch) => ch.codePointAt(0));
  const cb = Array.from(b, (ch) => ch.codePointAt(0));
  const length = Math.min(ca.length, cb.length);
  for (let i = 0; i < length; i += 1) if (ca[i] !== cb[i]) return ca[i] < cb[i] ? -1 : 1;
  return ca.length - cb.length;
}

// ---- the model: rules_model.parse_rules_answer for one rule set --------------------------------------------------------

function itemsOf(value, what) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === false || value === 0 || value === "") return [];
  if (typeof value === "object" && Object.keys(value).length === 0) return [];
  throw new RulesAnswerInvalid(`${what} malformed`);
}

function isMapping(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** rules_model._descriptions: `for item in items or ()`, mappings only (a string or an object iterates to nothing that
 *  counts; a number or `true` is not iterable -- the reference fails there, so does this port). */
function descriptionsOf(items, textKey) {
  if (Array.isArray(items)) return items.filter(isMapping).map((item) => [fieldOf(item, "language"), fieldOf(item, textKey)]);
  if ((typeof items === "number" && items !== 0) || items === true) throw new RulesAnswerInvalid("description list malformed");
  return [];
}

/** One rule of the Rules answer (field names of the Rules API v1, values stripped strings). */
export function parseRule(raw) {
  if (!isMapping(raw)) throw new RulesAnswerInvalid("Rule malformed");
  return {
    ruleNo: fieldOf(raw, "RuleNo"),
    logic: fieldOf(raw, "RLogic"),
    definition: fieldOf(raw, "RDefinition"),
    hsRange: fieldOf(raw, "HsRange"),
    operator: fieldOf(raw, "Roperator"),
    percent: fieldOf(raw, "Rpercent"),
    target: fieldOf(raw, "Rtarget"),
    proof: fieldOf(raw, "Rproof"),
    proofAlt: fieldOf(raw, "ProofAlt"),
    weight: fieldOf(raw, "WeightR"),
    orcrit: fieldOf(raw, "Rorcrit"),
    fingerprint: fieldOf(raw, "RuleFingerprint"),
  };
}

/** One rule set of the Rules answer, groups and rules in the answer's order. */
export function parseRuleSet(raw) {
  if (!isMapping(raw)) throw new RulesAnswerInvalid("RuleSet malformed");
  const groups = itemsOf(raw.RuleGroups, "RuleGroup").map((rawGroup) => {
    if (!isMapping(rawGroup)) throw new RulesAnswerInvalid("RuleGroup malformed");
    return {
      group: fieldOf(rawGroup, "RGroup"),
      logic: fieldOf(rawGroup, "RGroupLog"),
      subGroup: fieldOf(rawGroup, "SubGroupNo"),
      rules: itemsOf(rawGroup.Rules, "Rule").map(parseRule),
      descriptions: descriptionsOf(rawGroup.RuleGroupDescr, "DescRg"),
      validFrom: fieldOf(rawGroup, "StartRgroup"),
      validTo: fieldOf(rawGroup, "EndRgroup"),
    };
  });
  return {
    hsPos: fieldOf(raw, "Hspos"),
    hsPosIndex: fieldOf(raw, "Hsposindx"),
    exFlag: fieldOf(raw, "ExFlag"),
    fingerprint: fieldOf(raw, "RuleSetFingerprint"),
    groups,
    descriptions: descriptionsOf(raw.RuleSetDescr, "DescRset"),
    validFrom: fieldOf(raw, "StartRset"),
    validTo: fieldOf(raw, "EndRset"),
  };
}

/** RuleSet.group_logic: the RGroupLog of the FIRST group, upper-cased; AND when there is none or it is empty. */
export function groupLogicOf(ruleSet) {
  return (ruleSet.groups.length ? ruleSet.groups[0].logic.toUpperCase() : "AND") || "AND";
}

/** RuleSet.is_exception: ExFlag "1". */
export function isException(ruleSet) {
  return pyStrip(ruleSet.exFlag) === "1";
}

/** The guide's rule-set key (engine.py): "<Hspos>/<Hsposindx or 1>". */
export function ruleSetKeyOf(ruleSet) {
  return `${ruleSet.hsPos}/${ruleSet.hsPosIndex || "1"}`;
}

/** rules_model.shape_of: the name of the combination of RDefinition, Roperator, Rpercent, Rtarget, WeightR, HsRange. */
export function shapeOf(rule) {
  const definition = rule.definition.toUpperCase();
  if (definition === "NO_RESTRICTION") return RuleShape.NO_RESTRICTION;
  if (definition === "DESCRIPTION") return RuleShape.DESCRIPTION;
  if (definition === "50_50") return RuleShape.FIFTY_FIFTY;
  if (definition !== "HSRANGE" || rule.orcrit) return RuleShape.UNSUPPORTED;
  if (pyStrip(rule.weight) === "1") return RuleShape.WEIGHT_RULE;
  const percent = percentOf(rule.percent);
  const operator = rule.operator.toUpperCase();
  if (percent === null || !["LE", "LT", "EQ", "GT", "GE"].includes(operator)) return RuleShape.UNSUPPORTED;
  if (["VMU", "MAT"].includes(rule.target.toUpperCase())) return RuleShape.ABSOLUTE_VALUE;
  const scope = pyStrip(rule.hsRange);
  if (operator === "EQ" && percent === 0) {
    if (PLACEHOLDER_HEADING.test(scope)) return RuleShape.CHANGE_OF_HEADING;
    if (PLACEHOLDER_SUBHEADING.test(scope)) return RuleShape.CHANGE_OF_SUBHEADING;
    if (STATIC.test(scope)) {
      return { 2: RuleShape.CHANGE_OF_CHAPTER, 4: RuleShape.CHANGE_OF_HEADING, 6: RuleShape.CHANGE_OF_SUBHEADING }[scope.length]
        || RuleShape.HS_EXCLUSION;
    }
    return RuleShape.HS_EXCLUSION;
  }
  if (operator === "EQ" && percent === 100) return RuleShape.ONLY_FROM_HS;
  if ((operator === "LE" || operator === "LT") && percent > 0 && percent < 100) return RuleShape.VALUE_LIMIT;
  if (operator === "GE" || operator === "GT") return RuleShape.VALUE_MINIMUM;
  return RuleShape.VALUE_SHARE;
}

// ---- rule_structure.py --------------------------------------------------------------------------------------------------

/** AND / OR node over conditions or sub-expressions -- the original structure (rule_structure.Expr). */
export class Expr {
  constructor(op, children = [], condition = null, label = "") {
    this.op = op; // "AND" | "OR" | "COND"
    this.children = children;
    this.condition = condition;
    this.label = label; // G1, OR-1, G1.R2, SET, EMPTY
  }

  toJson() {
    if (this.op === "COND") return { op: "COND", key: this.condition ? this.condition.key : this.label };
    return { op: this.op, label: this.label, children: this.children.map((child) => child.toJson()) };
  }

  text() {
    if (this.op === "COND") return this.condition ? this.condition.key : this.label;
    if (this.children.length === 1) return this.children[0].text();
    const joiner = this.op === "AND" ? " ∧ " : " ∨ ";
    return this.children
      .map((child) => (child.op === "COND" || child.children.length === 1 ? child.text() : `(${child.text()})`))
      .join(joiner);
  }
}

/** _group_expr: the conditions G<group>.R<rule> of one group and its node (OR only when EVERY rule is OR-linked). */
function groupExpr(group, index) {
  const label = `G${group.group || index + 1}`;
  const conditions = group.rules.map((rule, j) => ({ key: `${label}.R${rule.ruleNo || j + 1}`, group, rule, shape: shapeOf(rule) }));
  const nodes = conditions.map((condition) => new Expr("COND", [], condition, condition.key));
  if (nodes.length === 1) return { node: new Expr("AND", nodes, null, label), conditions };
  const innerOr = group.rules.length > 0 && group.rules.every((rule) => rule.logic.toUpperCase() === "OR");
  return { node: new Expr(innerOr ? "OR" : "AND", nodes, null, label), conditions };
}

/** expression_of: the Boolean expression of a rule set exactly as the Rules data encode it. */
export function expressionOf(ruleSet) {
  const notes = [];
  const groups = ruleSet.groups;
  const allConditions = [];
  const groupNodes = [];
  groups.forEach((group, index) => {
    const { node, conditions } = groupExpr(group, index);
    allConditions.push(...conditions);
    groupNodes.push({ group, node });
  });
  if (!groups.length) return { expression: new Expr("AND", [], null, "EMPTY"), conditions: [], notes: ["NO_GROUPS"] };
  if (groupLogicOf(ruleSet) === "OR") {
    if (groups.some((group) => pyStrip(group.subGroup))) notes.push("SUBGROUPS_UNDER_OR_IGNORED");
    return { expression: new Expr("OR", groupNodes.map((entry) => entry.node), null, "SET"), conditions: allConditions, notes };
  }
  // brackets: the bracketed groups sorted (stable) by SubGroupNo and grouped (itertools.groupby over the sorted list)
  const bracketed = groupNodes.filter((entry) => pyStrip(entry.group.subGroup));
  const sorted = [...bracketed].sort((a, b) => comparePy(a.group.subGroup, b.group.subGroup));
  const brackets = [];
  for (let i = 0; i < sorted.length;) {
    const label = sorted[i].group.subGroup;
    let j = i;
    while (j < sorted.length && sorted[j].group.subGroup === label) j += 1;
    const nodes = sorted.slice(i, j).map((entry) => entry.node);
    brackets.push(nodes.length > 1 ? new Expr("OR", nodes, null, label) : nodes[0]);
    i = j;
  }
  // keep the original order: mandatory groups and brackets as they first appear
  const ordered = [];
  const seenBrackets = new Set();
  for (const { group, node } of groupNodes) {
    if (!pyStrip(group.subGroup)) {
      ordered.push(node);
    } else if (!seenBrackets.has(group.subGroup)) {
      seenBrackets.add(group.subGroup);
      const bracket = brackets.find((b) => b.label === group.subGroup || (b.op !== "OR" && b === node));
      if (bracket === undefined) {
        throw new StructureUndetermined(
          `Klammer ${group.subGroup}: eine einzelne Regelgruppe mit ODER-verknüpften Regeln – die Referenzlogik bricht hier ab (StopIteration).`,
        );
      }
      ordered.push(bracket);
    }
  }
  return { expression: new Expr("AND", ordered, null, "SET"), conditions: allConditions, notes };
}

/** _dnf: the disjunctive normal form; the AND product is cut to MAX_ALTERNATIVES * 4 terms after each child (generated in
 *  product order and stopped at the cut -- the same terms as building the full product and slicing it). */
function dnf(expr) {
  if (expr.op === "COND") return expr.condition !== null ? [[expr.condition]] : [[]];
  if (expr.op === "OR") {
    const out = [];
    for (const child of expr.children) for (const term of dnf(child)) out.push(term);
    return out;
  }
  const cap = MAX_ALTERNATIVES * 4;
  let terms = [[]];
  for (const child of expr.children) {
    const childTerms = dnf(child);
    const next = [];
    outer: for (const a of terms) {
      for (const b of childTerms) {
        next.push(a.concat(b));
        if (next.length > cap) break outer;
      }
    }
    terms = next.length > cap ? next.slice(0, cap) : next;
  }
  return terms;
}

/** structure_of: expression, conditions, the deduplicated complete alternatives (at most MAX_ALTERNATIVES), notes. */
export function structureOf(ruleSet) {
  const { expression, conditions, notes } = expressionOf(ruleSet);
  const seen = new Set();
  const alternatives = [];
  for (const term of dnf(expression)) {
    const keys = term.map((condition) => condition.key);
    const identity = JSON.stringify(keys);
    if (seen.has(identity)) continue;
    seen.add(identity);
    const groups = [...new Set(term.map((condition) => condition.group.group))];
    alternatives.push({ key: keys.join("+") || "NONE", conditions: term, groups });
  }
  return {
    ruleSet,
    expression,
    conditions,
    alternatives: alternatives.slice(0, MAX_ALTERNATIVES),
    truncated: alternatives.length > MAX_ALTERNATIVES,
    notes,
    groupLogic: groupLogicOf(ruleSet),
  };
}

/** {G1.R1: shape, ...} -- like the reference's dict comprehension (a repeated key keeps its first position, last value). */
export function shapesOf(structure) {
  const shapes = {};
  for (const condition of structure.conditions) shapes[condition.key] = condition.shape;
  return shapes;
}

/** The summary of one rule set in the format of the documented expectations (testcases.json `rule_sets[]`). */
export function summarizeRuleSet(rawRuleSet) {
  const ruleSet = parseRuleSet(rawRuleSet);
  const structure = structureOf(ruleSet);
  return {
    key: ruleSetKeyOf(ruleSet),
    ex: isException(ruleSet),
    fingerprint: ruleSet.fingerprint,
    groups: ruleSet.groups.length,
    rules: ruleSet.groups.reduce((sum, group) => sum + group.rules.length, 0),
    expression_text: structure.expression.text(),
    alternatives: structure.alternatives.map((alternative) => alternative.key),
    alternative_count: structure.alternatives.length,
    truncated: structure.truncated,
    notes: [...structure.notes],
    shapes: shapesOf(structure),
  };
}
