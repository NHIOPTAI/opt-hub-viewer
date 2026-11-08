// The port of the guide's structure logic (docs/assets/devhub/rules-structure.js) against the guide's own results.
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  Expr, groupLogicOf, isException, MAX_ALTERNATIVES, parseRuleSet, percentOf, pyFloat, pyStrip, RuleShape, ruleSetKeyOf,
  RulesAnswerInvalid, shapeOf, shapesOf, StructureUndetermined, structureOf, summarizeRuleSet,
} from "../../docs/assets/devhub/rules-structure.js";
import { fixture, withDefaults } from "./helpers.js";

const sorted = (list) => [...list].sort();

function computed(rawSet) {
  const ruleSet = parseRuleSet(rawSet);
  const structure = structureOf(ruleSet);
  return { ruleSet, structure, summary: summarizeRuleSet(rawSet) };
}

// The cross-check against the guide's reading of 199 REAL rule sets moved to the private OPT-AI repository in V1.1
// (scripts/demo_hub/devhub_port_check.mjs over scripts/demo_hub/devhub_private/): real rule-set structures never enter this public repository.

describe("synthetic structures (structure_synthetic.json), alternatives in exact order", () => {
  const data = fixture("structure_synthetic.json");
  test("the fixture holds 9 cases", () => assert.equal(data.cases.length, 9));
  for (const testCase of data.cases) {
    test(testCase.id, () => {
      const { structure, summary } = computed(withDefaults(testCase.input));
      const { expression, ...expectedSummary } = testCase.expected;
      assert.deepStrictEqual(summary, expectedSummary);
      assert.deepStrictEqual(structure.expression.toJson(), expression, "expression JSON");
    });
  }
});

describe("edge vectors computed by the Python reference (structure_edge_reference.json)", () => {
  const data = fixture("structure_edge_reference.json");
  test("the fixture holds 115 cases", () => assert.equal(data.cases.length, 115));
  for (const testCase of data.cases) {
    test(testCase.id, () => {
      const raw = withDefaults(testCase.input);
      if (testCase.error) {
        assert.equal(testCase.error, "StopIteration");
        assert.throws(() => structureOf(parseRuleSet(raw)), StructureUndetermined);
        assert.throws(() => summarizeRuleSet(raw), StructureUndetermined);
        return;
      }
      const { ruleSet, structure, summary } = computed(raw);
      const e = testCase.expected;
      assert.equal(summary.key, e.key, "key");
      assert.equal(summary.ex, e.ex, "ex");
      assert.equal(summary.fingerprint, e.fingerprint, "fingerprint");
      assert.equal(summary.groups, e.groups, "groups");
      assert.equal(summary.rules, e.rules, "rules");
      assert.equal(structure.expression.text(), e.text, "expression text");
      assert.deepStrictEqual(structure.expression.toJson(), e.expression, "expression JSON");
      assert.equal(groupLogicOf(ruleSet), e.group_logic, "group logic");
      assert.deepStrictEqual(summary.alternatives, e.alternatives, "alternatives (exact order)");
      assert.deepStrictEqual(structure.alternatives.map((a) => a.groups), e.alternative_groups, "groups of each alternative");
      assert.equal(summary.alternative_count, e.alternative_count, "alternative_count");
      assert.equal(summary.truncated, e.truncated, "truncated");
      assert.deepStrictEqual(summary.notes, e.notes, "notes");
      assert.deepStrictEqual(summary.shapes, e.shapes, "shapes");
    });
  }
});

describe("ported semantics, named explicitly", () => {
  const rule = (over = {}) => ({ RuleNo: "1", RLogic: "AND", RDefinition: "HSRANGE", HsRange: "*", Roperator: "LE", Rpercent: "50",
    Rtarget: "VOU", Rproof: "TOP", ProofAlt: "", WeightR: "0", Rorcrit: "", ...over });
  const shape = (over) => shapeOf(parseRuleSet(withDefaults({ RuleGroups: [{ RGroup: "1", RGroupLog: "AND", SubGroupNo: "", Rules: [rule(over)] }] })).groups[0].rules[0]);

  test("MAX_ALTERNATIVES is 64", () => assert.equal(MAX_ALTERNATIVES, 64));

  test("placeholders: only 99XX / 9999XX / 99XXXX are change rules, a range like 84XX stays HS_EXCLUSION (as the guide)", () => {
    const eq0 = (range) => shape({ Roperator: "EQ", Rpercent: "0", HsRange: range });
    assert.equal(eq0("99XX"), RuleShape.CHANGE_OF_HEADING);
    assert.equal(eq0("9999XX"), RuleShape.CHANGE_OF_SUBHEADING);
    assert.equal(eq0("99XXXX"), RuleShape.CHANGE_OF_SUBHEADING);
    assert.equal(eq0("84XX"), RuleShape.HS_EXCLUSION);
    assert.equal(eq0("8407XX"), RuleShape.HS_EXCLUSION);
    assert.equal(eq0("84"), RuleShape.CHANGE_OF_CHAPTER);
    assert.equal(eq0("8407"), RuleShape.CHANGE_OF_HEADING);
    assert.equal(eq0("840710"), RuleShape.CHANGE_OF_SUBHEADING);
    assert.equal(eq0("84071000"), RuleShape.HS_EXCLUSION);
  });

  test("_percent: Python float() after every comma became a dot -- empty and hex are no number", () => {
    assert.equal(percentOf("40,5"), 40.5);
    assert.equal(percentOf("1_0"), 10);
    assert.equal(percentOf(""), null);
    assert.equal(percentOf("0x10"), null);
    assert.equal(percentOf("1,000,5"), null);
    assert.ok(Number.isNaN(percentOf("nan")));
    assert.equal(percentOf("-inf"), -Infinity);
    assert.equal(pyFloat("٥٠"), 50);
    assert.equal(pyFloat("\u001c50"), null);
    assert.equal(pyFloat(" 50　"), 50);
  });

  test("Python strip(): U+001C..U+001F and U+0085 go, U+FEFF stays (unlike String.prototype.trim)", () => {
    assert.equal(pyStrip("\u001c\u0085 a  "), "a");
    assert.equal(pyStrip("﻿a"), "﻿a");
  });

  test("group logic = RGroupLog of the FIRST group, upper-cased, AND by default", () => {
    const set = (logics) => parseRuleSet(withDefaults({ RuleGroups: logics.map((log, i) => ({ RGroup: String(i + 1), RGroupLog: log, Rules: [rule()] })) }));
    assert.equal(groupLogicOf(set(["or", "AND"])), "OR");
    assert.equal(groupLogicOf(set(["AND", "OR"])), "AND");
    assert.equal(groupLogicOf(set(["", "OR"])), "AND");
    assert.equal(groupLogicOf(set([])), "AND");
  });

  test("the rule-set key and EX as the guide states them", () => {
    const ruleSet = parseRuleSet({ Hspos: " 8407 ", Hsposindx: "", ExFlag: " 1 ", RuleGroups: [] });
    assert.equal(ruleSetKeyOf(ruleSet), "8407/1");
    assert.equal(isException(ruleSet), true);
  });

  test("a malformed answer fails closed", () => {
    assert.throws(() => parseRuleSet(null), RulesAnswerInvalid);
    assert.throws(() => parseRuleSet({ RuleGroups: ["x"] }), RulesAnswerInvalid);
    assert.throws(() => parseRuleSet({ RuleGroups: [{ Rules: [7] }] }), RulesAnswerInvalid);
  });

  test("Expr.text brackets nested nodes, a single child is transparent", () => {
    const cond = (key) => new Expr("COND", [], { key }, key);
    const and = new Expr("AND", [new Expr("OR", [cond("G1.R1"), cond("G1.R2")], null, "G1"), new Expr("AND", [cond("G2.R1")], null, "G2")], null, "SET");
    assert.equal(and.text(), "(G1.R1 ∨ G1.R2) ∧ G2.R1");
    assert.deepStrictEqual(new Expr("AND", [cond("G1.R1")], null, "G1").toJson(), { op: "AND", label: "G1", children: [{ op: "COND", key: "G1.R1" }] });
  });

  test("shapesOf keeps a repeated key once", () => {
    const structure = structureOf(parseRuleSet(withDefaults({ RuleGroups: [{ RGroup: "1", Rules: [rule()] }, { RGroup: "1", Rules: [rule({ RDefinition: "DESCRIPTION" })] }] })));
    assert.deepStrictEqual(shapesOf(structure), { "G1.R1": RuleShape.DESCRIPTION });
    assert.deepStrictEqual(structure.alternatives.map((a) => a.key), ["G1.R1+G1.R1"]);
  });
});
