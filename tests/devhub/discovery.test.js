// Country and agreement discovery (docs/assets/devhub/discovery.js) over the SYNTHETIC GET /v1/agreements answer of the
// offline mode (V1.1: ZZ test data only), and the business examples against it.
import assert from "node:assert/strict";
import { describe, test } from "node:test";

import RECORDINGS from "../../docs/assets/devhub/data/recordings.js";
import { agreementsForPair, buildCountryRelations, sortCountryEntries, validAt } from "../../docs/assets/devhub/discovery.js";
import { BUSINESS_EXAMPLES } from "../../docs/assets/devhub/examples.js";
import { validateRulesInput } from "../../docs/assets/devhub/request.js";
import { caseForRequest } from "../../docs/assets/devhub/testcases.js";
import TESTCASES from "../../docs/assets/devhub/data/testcases.js";
import { buildRulesBody } from "../../docs/assets/devhub/request.js";

const AGREEMENTS = RECORDINGS.recordings.__agreements__.body.agreements;

describe("discovery", () => {
  const relations = buildCountryRelations(AGREEMENTS);

  test("countries of export and the destinations reachable from each (synthetic XA -> XB / XC)", () => {
    assert.match(relations.fromNames.get("XA"), /^ZZ-/);
    assert.equal(relations.fromNames.size, 1);
    assert.deepStrictEqual([...relations.relations.get("XA").keys()].sort(), ["XB", "XC"]);
    assert.equal(relations.relations.has("XD"), false);
  });

  test("sorted by name, iso2 as the tiebreaker and fallback", () => {
    const entries = sortCountryEntries(new Map([["XS", "Serbia"], ["RS", "Serbia"], ["AA", ""], ["BB", "albania"]]));
    assert.deepStrictEqual(entries.map((e) => e.iso2), ["AA", "BB", "RS", "XS"]);
  });

  test("agreements of a pair (the explicit content_id choices)", () => {
    assert.deepStrictEqual(agreementsForPair(AGREEMENTS, "XA", "XB").map((a) => a.content_id), ["ZZ_TEST01", "ZZ_TEST03"]);
    assert.deepStrictEqual(agreementsForPair(AGREEMENTS, "XA", "XC").map((a) => a.content_id), ["ZZ_TEST02"]);
    assert.deepStrictEqual(agreementsForPair(AGREEMENTS, "XD", "XB"), []);
    assert.deepStrictEqual(agreementsForPair(AGREEMENTS, "XA", ""), []);
    const unsorted = [{ content_id: "ZZ_B", country_from: [{ iso2: "XA" }], country_to: [{ iso2: "XB" }] }, { content_id: "ZZ_A", country_from: [{ iso2: "XA" }], country_to: [{ iso2: "XB" }] }];
    assert.deepStrictEqual(agreementsForPair(unsorted, "XA", "XB").map((a) => a.content_id), ["ZZ_A", "ZZ_B"]);
  });

  test("an agreement's own validity at the key date (inclusive, open bounds)", () => {
    const agreement = { valid_from: "2025-01-01", valid_to: "9999-12-31" };
    assert.equal(validAt(agreement, "2025-01-01"), true);
    assert.equal(validAt(agreement, "2024-12-31"), false);
    assert.equal(validAt({ valid_from: "", valid_to: "2026-12-31" }, "2027-01-01"), false);
    assert.equal(validAt(agreement, "31.12.2026"), null);
  });

  test("an empty discovery yields no country (never a backfilled list)", () => {
    const empty = buildCountryRelations([]);
    assert.equal(empty.fromNames.size, 0);
    assert.equal(empty.relations.size, 0);
  });
});

describe("business examples (synthetic)", () => {
  test("every example is a valid input whose pair and agreement the synthetic discovery offers", () => {
    assert.ok(BUSINESS_EXAMPLES.length >= 3);
    for (const example of BUSINESS_EXAMPLES) {
      const form = example.form;
      assert.deepStrictEqual(validateRulesInput(form).errors, [], example.id);
      const pair = agreementsForPair(AGREEMENTS, form.country_from, form.country_to).map((a) => a.content_id);
      assert.ok(pair.length > 0, `${example.id}: pair in the discovery`);
      if (form.content_id) assert.ok(pair.includes(form.content_id), `${example.id}: ${form.content_id}`);
      assert.ok(example.title && example.description, example.id);
      assert.doesNotMatch(example.description, /PASS|FAIL/);
    }
  });

  test("every example has its synthetic answer in the offline mode (a fixed key date, never 'today')", () => {
    for (const example of BUSINESS_EXAMPLES) {
      assert.match(example.form.as_of_date, /^\d{4}-\d{2}-\d{2}$/, example.id);
      assert.ok(caseForRequest(TESTCASES.cases, buildRulesBody(example.form)), `${example.id}: a synthetic case answers it`);
    }
  });
});
