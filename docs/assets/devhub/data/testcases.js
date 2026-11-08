// OPT.AI Developer Hub -- the synthetic regression cases (ZZ test data, generated 2026-11-08): requests and
// expectations computed by the OPT.AI guide over synthetic answers -- no live data. Regenerate: tools/sync-fixtures.mjs (README).
export default {
 "_meta": {
  "expected_as_of": "2026-11-08",
  "synthetic": true,
  "source": "the guide's structure_of over synthetic ZZ answers in the Rules API v1 format (no live data) (structure only)"
 },
 "cases": [
  {
   "id": "ZZ_EX_OR",
   "title": "Kapitelregel mit zwei Alternativen in einer Regelgruppe (EX)",
   "request": {
    "country_from": "XA",
    "country_to": "XB",
    "hs_code": "9901",
    "language": "DE,EN,FR",
    "as_of_date": "2026-11-08",
    "content_id": "ZZ_TEST01"
   },
   "expected": {
    "status": 200,
    "content_id": "ZZ_TEST01",
    "hs_resolution": {
     "matched_hs": "99",
     "hs_match_level": 2,
     "fallback_used": true,
     "temporal_fallback": false
    },
    "rule_set_count": 1,
    "rule_sets": [
     {
      "key": "99/1",
      "ex": true,
      "fingerprint": "zz-set-99-1",
      "groups": 1,
      "rules": 2,
      "expression_text": "G1.R1 ∨ G1.R2",
      "alternatives": [
       "G1.R1",
       "G1.R2"
      ],
      "alternative_count": 2,
      "truncated": false,
      "notes": [],
      "shapes": {
       "G1.R1": "VALUE_LIMIT",
       "G1.R2": "CHANGE_OF_HEADING"
      }
     }
    ],
    "response_version": "v1.2"
   },
   "expected_as_of": "2026-11-08"
  },
  {
   "id": "ZZ_TEMPORAL",
   "title": "Zeitlicher Rückfall: spezifische Regel erst ab 01.01.2025",
   "request": {
    "country_from": "XA",
    "country_to": "XB",
    "hs_code": "9902",
    "language": "DE,EN,FR",
    "as_of_date": "2024-12-31",
    "content_id": "ZZ_TEST01"
   },
   "expected": {
    "status": 200,
    "content_id": "ZZ_TEST01",
    "hs_resolution": {
     "matched_hs": "99",
     "hs_match_level": 2,
     "fallback_used": true,
     "temporal_fallback": true
    },
    "rule_set_count": 1,
    "rule_sets": [
     {
      "key": "99/1",
      "ex": true,
      "fingerprint": "zz-set-99-1",
      "groups": 1,
      "rules": 1,
      "expression_text": "G1.R1",
      "alternatives": [
       "G1.R1"
      ],
      "alternative_count": 1,
      "truncated": false,
      "notes": [],
      "shapes": {
       "G1.R1": "CHANGE_OF_HEADING"
      }
     }
    ],
    "response_version": "v1.2"
   },
   "expected_as_of": "2026-11-08"
  },
  {
   "id": "ZZ_SPECIFIC",
   "title": "Spezifische Positionsregel ab 01.01.2025",
   "request": {
    "country_from": "XA",
    "country_to": "XB",
    "hs_code": "9902",
    "language": "DE,EN,FR",
    "as_of_date": "2025-01-02",
    "content_id": "ZZ_TEST01"
   },
   "expected": {
    "status": 200,
    "content_id": "ZZ_TEST01",
    "hs_resolution": {
     "matched_hs": "9902",
     "hs_match_level": 4,
     "fallback_used": false,
     "temporal_fallback": false
    },
    "rule_set_count": 1,
    "rule_sets": [
     {
      "key": "9902/1",
      "ex": false,
      "fingerprint": "zz-set-9902-1",
      "groups": 1,
      "rules": 1,
      "expression_text": "G1.R1",
      "alternatives": [
       "G1.R1"
      ],
      "alternative_count": 1,
      "truncated": false,
      "notes": [],
      "shapes": {
       "G1.R1": "VALUE_LIMIT"
      }
     }
    ],
    "response_version": "v1.2"
   },
   "expected_as_of": "2026-11-08"
  },
  {
   "id": "ZZ_STATE_2026",
   "title": "Regelstand bis 31.12.2026",
   "request": {
    "country_from": "XA",
    "country_to": "XC",
    "hs_code": "990310",
    "language": "DE,EN,FR",
    "as_of_date": "2026-12-31",
    "content_id": "ZZ_TEST02"
   },
   "expected": {
    "status": 200,
    "content_id": "ZZ_TEST02",
    "hs_resolution": {
     "matched_hs": "9903",
     "hs_match_level": 4,
     "fallback_used": true,
     "temporal_fallback": false
    },
    "rule_set_count": 1,
    "rule_sets": [
     {
      "key": "9903/1",
      "ex": false,
      "fingerprint": "zz-set-9903-1-2026",
      "groups": 1,
      "rules": 1,
      "expression_text": "G1.R1",
      "alternatives": [
       "G1.R1"
      ],
      "alternative_count": 1,
      "truncated": false,
      "notes": [],
      "shapes": {
       "G1.R1": "VALUE_LIMIT"
      }
     }
    ],
    "response_version": "v1.2"
   },
   "expected_as_of": "2026-11-08"
  },
  {
   "id": "ZZ_STATE_2027",
   "title": "Regelstand ab 01.01.2027 (anderer Regelsatz)",
   "request": {
    "country_from": "XA",
    "country_to": "XC",
    "hs_code": "990310",
    "language": "DE,EN,FR",
    "as_of_date": "2027-01-01",
    "content_id": "ZZ_TEST02"
   },
   "expected": {
    "status": 200,
    "content_id": "ZZ_TEST02",
    "hs_resolution": {
     "matched_hs": "9903",
     "hs_match_level": 4,
     "fallback_used": true,
     "temporal_fallback": false
    },
    "rule_set_count": 1,
    "rule_sets": [
     {
      "key": "9903/1",
      "ex": false,
      "fingerprint": "zz-set-9903-1-2027",
      "groups": 1,
      "rules": 2,
      "expression_text": "G1.R1 ∨ G1.R2",
      "alternatives": [
       "G1.R1",
       "G1.R2"
      ],
      "alternative_count": 2,
      "truncated": false,
      "notes": [],
      "shapes": {
       "G1.R1": "VALUE_LIMIT",
       "G1.R2": "CHANGE_OF_SUBHEADING"
      }
     }
    ],
    "response_version": "v1.2"
   },
   "expected_as_of": "2026-11-08"
  },
  {
   "id": "ZZ_MULTI",
   "title": "Mehrere gleichrangige Regelsätze",
   "request": {
    "country_from": "XA",
    "country_to": "XB",
    "hs_code": "9904",
    "language": "DE,EN,FR",
    "as_of_date": "2026-11-08",
    "content_id": "ZZ_TEST01"
   },
   "expected": {
    "status": 200,
    "content_id": "ZZ_TEST01",
    "hs_resolution": {
     "matched_hs": "9904",
     "hs_match_level": 4,
     "fallback_used": false,
     "temporal_fallback": false
    },
    "rule_set_count": 2,
    "rule_sets": [
     {
      "key": "9904/1",
      "ex": false,
      "fingerprint": "zz-set-9904-1",
      "groups": 1,
      "rules": 1,
      "expression_text": "G1.R1",
      "alternatives": [
       "G1.R1"
      ],
      "alternative_count": 1,
      "truncated": false,
      "notes": [],
      "shapes": {
       "G1.R1": "VALUE_LIMIT"
      }
     },
     {
      "key": "9904/2",
      "ex": false,
      "fingerprint": "zz-set-9904-2",
      "groups": 1,
      "rules": 2,
      "expression_text": "G1.R1 ∧ G1.R2",
      "alternatives": [
       "G1.R1+G1.R2"
      ],
      "alternative_count": 1,
      "truncated": false,
      "notes": [],
      "shapes": {
       "G1.R1": "CHANGE_OF_HEADING",
       "G1.R2": "VALUE_LIMIT"
      }
     }
    ],
    "response_version": "v1.2"
   },
   "expected_as_of": "2026-11-08"
  },
  {
   "id": "ZZ_EX_CANDIDATES",
   "title": "EX-Regelsätze, mehrere Kandidaten",
   "request": {
    "country_from": "XA",
    "country_to": "XB",
    "hs_code": "9905",
    "language": "DE,EN,FR",
    "as_of_date": "2026-11-08",
    "content_id": "ZZ_TEST01"
   },
   "expected": {
    "status": 200,
    "content_id": "ZZ_TEST01",
    "hs_resolution": {
     "matched_hs": "9905",
     "hs_match_level": 4,
     "fallback_used": false,
     "temporal_fallback": false
    },
    "rule_set_count": 2,
    "rule_sets": [
     {
      "key": "9905/1",
      "ex": true,
      "fingerprint": "zz-set-9905-1",
      "groups": 1,
      "rules": 1,
      "expression_text": "G1.R1",
      "alternatives": [
       "G1.R1"
      ],
      "alternative_count": 1,
      "truncated": false,
      "notes": [],
      "shapes": {
       "G1.R1": "CHANGE_OF_HEADING"
      }
     },
     {
      "key": "9905/2",
      "ex": true,
      "fingerprint": "zz-set-9905-2",
      "groups": 1,
      "rules": 1,
      "expression_text": "G1.R1",
      "alternatives": [
       "G1.R1"
      ],
      "alternative_count": 1,
      "truncated": false,
      "notes": [],
      "shapes": {
       "G1.R1": "DESCRIPTION"
      }
     }
    ],
    "response_version": "v1.2"
   },
   "expected_as_of": "2026-11-08"
  },
  {
   "id": "ZZ_FOUR",
   "title": "Vier Alternativen",
   "request": {
    "country_from": "XA",
    "country_to": "XB",
    "hs_code": "9906",
    "language": "DE,EN,FR",
    "as_of_date": "2026-11-08",
    "content_id": "ZZ_TEST01"
   },
   "expected": {
    "status": 200,
    "content_id": "ZZ_TEST01",
    "hs_resolution": {
     "matched_hs": "9906",
     "hs_match_level": 4,
     "fallback_used": false,
     "temporal_fallback": false
    },
    "rule_set_count": 1,
    "rule_sets": [
     {
      "key": "9906/1",
      "ex": false,
      "fingerprint": "zz-set-9906-1",
      "groups": 4,
      "rules": 4,
      "expression_text": "G1.R1 ∨ G2.R1 ∨ G3.R1 ∨ G4.R1",
      "alternatives": [
       "G1.R1",
       "G2.R1",
       "G3.R1",
       "G4.R1"
      ],
      "alternative_count": 4,
      "truncated": false,
      "notes": [],
      "shapes": {
       "G1.R1": "VALUE_LIMIT",
       "G2.R1": "CHANGE_OF_HEADING",
       "G3.R1": "DESCRIPTION",
       "G4.R1": "CHANGE_OF_SUBHEADING"
      }
     }
    ],
    "response_version": "v1.2"
   },
   "expected_as_of": "2026-11-08"
  },
  {
   "id": "ZZ_NESTED",
   "title": "Verschachtelte Logik mit Klammer",
   "request": {
    "country_from": "XA",
    "country_to": "XB",
    "hs_code": "9907",
    "language": "DE,EN,FR",
    "as_of_date": "2026-11-08",
    "content_id": "ZZ_TEST01"
   },
   "expected": {
    "status": 200,
    "content_id": "ZZ_TEST01",
    "hs_resolution": {
     "matched_hs": "9907",
     "hs_match_level": 4,
     "fallback_used": false,
     "temporal_fallback": false
    },
    "rule_set_count": 1,
    "rule_sets": [
     {
      "key": "9907/1",
      "ex": false,
      "fingerprint": "zz-set-9907-1",
      "groups": 3,
      "rules": 4,
      "expression_text": "(G1.R1 ∨ (G2.R1 ∧ G2.R2)) ∧ G3.R1",
      "alternatives": [
       "G1.R1+G3.R1",
       "G2.R1+G2.R2+G3.R1"
      ],
      "alternative_count": 2,
      "truncated": false,
      "notes": [],
      "shapes": {
       "G1.R1": "CHANGE_OF_HEADING",
       "G2.R1": "DESCRIPTION",
       "G2.R2": "VALUE_LIMIT",
       "G3.R1": "VALUE_LIMIT"
      }
     }
    ],
    "response_version": "v1.2"
   },
   "expected_as_of": "2026-11-08"
  },
  {
   "id": "ZZ_AUTO",
   "title": "Abkommen automatisch ermittelt (ohne content_id)",
   "request": {
    "country_from": "XA",
    "country_to": "XB",
    "hs_code": "9908",
    "language": "DE,EN,FR",
    "as_of_date": "2026-11-08"
   },
   "expected": {
    "status": 200,
    "content_id": "ZZ_TEST01",
    "hs_resolution": {
     "matched_hs": "9908",
     "hs_match_level": 4,
     "fallback_used": false,
     "temporal_fallback": false
    },
    "rule_set_count": 1,
    "rule_sets": [
     {
      "key": "9908/1",
      "ex": false,
      "fingerprint": "zz-set-9908-1",
      "groups": 1,
      "rules": 1,
      "expression_text": "G1.R1",
      "alternatives": [
       "G1.R1"
      ],
      "alternative_count": 1,
      "truncated": false,
      "notes": [],
      "shapes": {
       "G1.R1": "NO_RESTRICTION"
      }
     }
    ],
    "response_version": "v1.2"
   },
   "expected_as_of": "2026-11-08"
  },
  {
   "id": "ZZ_BEFORE_DATA",
   "title": "Stichtag vor Beginn der Regeldaten",
   "request": {
    "country_from": "XA",
    "country_to": "XC",
    "hs_code": "990310",
    "language": "DE,EN,FR",
    "as_of_date": "2019-12-31",
    "content_id": "ZZ_TEST02"
   },
   "expected": {
    "status": 404,
    "error_code": "OPT-RULE-001",
    "error_reason": null
   },
   "expected_as_of": "2026-11-08"
  },
  {
   "id": "ZZ_ERR_MISSING_HS",
   "title": "Fehler: Pflichtfeld hs_code fehlt",
   "request": {
    "country_from": "XA",
    "country_to": "XB",
    "language": "DE,EN,FR",
    "as_of_date": "2026-11-08",
    "content_id": "ZZ_TEST01"
   },
   "expected": {
    "status": 400,
    "error_code": "OPT-REQ-001",
    "error_reason": null
   },
   "expected_as_of": "2026-11-08"
  },
  {
   "id": "ZZ_ERR_NO_RELATION",
   "title": "Fehler: keine Regel für das Länderpaar",
   "request": {
    "country_from": "XD",
    "country_to": "XB",
    "hs_code": "9901",
    "language": "DE,EN,FR",
    "as_of_date": "2026-11-08"
   },
   "expected": {
    "status": 404,
    "error_code": "OPT-RULE-001",
    "error_reason": null
   },
   "expected_as_of": "2026-11-08"
  },
  {
   "id": "ZZ_ERR_UNKNOWN_HS",
   "title": "Fehler: unbekannte HS-Position",
   "request": {
    "country_from": "XA",
    "country_to": "XB",
    "hs_code": "9999",
    "language": "DE,EN,FR",
    "as_of_date": "2026-11-08",
    "content_id": "ZZ_TEST01"
   },
   "expected": {
    "status": 404,
    "error_code": "OPT-RULE-001",
    "error_reason": null
   },
   "expected_as_of": "2026-11-08"
  }
 ]
};
