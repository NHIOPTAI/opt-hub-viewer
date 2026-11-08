// OPT.AI Developer Hub -- the synthetic answers of the regression cases (Rules API v1 format, ZZ test data, generated 2026-11-08),
// loaded only for the offline mode and the synthetic runs. `__agreements__` is the synthetic GET /v1/agreements answer.
// No live data. Regenerate: tools/sync-fixtures.mjs.
export default {
 "_meta": {
  "recorded_at": "2026-11-08",
  "synthetic": true,
  "source": "synthetic ZZ answers in the Rules API v1 format (no live data)",
  "rule_texts": "synthetic ZZ-TEST texts"
 },
 "recordings": {
  "ZZ_EX_OR": {
   "status": 200,
   "body": {
    "Request": {
     "country_from": "XA",
     "country_to": "XB",
     "hs_code": "9901",
     "language": "DE,EN,FR",
     "languages": [
      "DE",
      "EN",
      "FR"
     ],
     "as_of_date": "2026-11-08",
     "content_id": "ZZ_TEST01"
    },
    "Agreement": {
     "ContentId": "ZZ_TEST01",
     "StartCid": "01.01.2020",
     "EndCid": "31.12.9999",
     "ContentDescr": [
      {
       "language": "DE",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01"
      },
      {
       "language": "EN",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01 (EN)"
      },
      {
       "language": "FR",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01 (FR)"
      }
     ],
     "CountryFrom": [
      {
       "ExpCo_isoa2": "XA",
       "ExpCo_descr": "ZZ-Abgangsland A (synthetisch)"
      }
     ],
     "CountryTo": [
      {
       "DestCo_isoa2": "XB",
       "DestCo_descr": "ZZ-Zielland B (synthetisch)"
      }
     ],
     "Tolerances": [
      {
       "Tolfrom": "90",
       "Tolto": "97",
       "Tolval": "15",
       "Tolieflag": "EXCL",
       "Tolwflag": "0",
       "Orcrittol": ""
      }
     ],
     "RuleSets": [
      {
       "Hspos": "99",
       "StartRset": "01.01.2020",
       "EndRset": "31.12.9999",
       "Hsposindx": "1",
       "ExFlag": "1",
       "RuleSetDescr": [
        {
         "language": "DE",
         "DescRset": "ZZ-TEST Warenbeschreibung 99/1"
        },
        {
         "language": "EN",
         "DescRset": "ZZ-TEST Warenbeschreibung 99/1 (EN)"
        },
        {
         "language": "FR",
         "DescRset": "ZZ-TEST Warenbeschreibung 99/1 (FR)"
        }
       ],
       "RuleSetFingerprint": "zz-set-99-1",
       "RuleGroups": [
        {
         "RGroup": "1",
         "RGroupLog": "AND",
         "SubGroupNo": "",
         "StartRgroup": "01.01.2020",
         "EndRgroup": "31.12.9999",
         "RuleGroupDescr": [
          {
           "language": "DE",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 99/1"
          },
          {
           "language": "EN",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 99/1 (EN)"
          },
          {
           "language": "FR",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 99/1 (FR)"
          }
         ],
         "Rules": [
          {
           "RuleNo": "1",
           "RLogic": "OR",
           "RDefinition": "HSRANGE",
           "HsRange": "*",
           "Roperator": "LE",
           "Rpercent": "60",
           "Rtarget": "VOU",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-99-1-g1-r1"
          },
          {
           "RuleNo": "2",
           "RLogic": "OR",
           "RDefinition": "HSRANGE",
           "HsRange": "99XX",
           "Roperator": "EQ",
           "Rpercent": "0",
           "Rtarget": "VOU",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-99-1-g1-r2"
          }
         ]
        }
       ]
      }
     ]
    },
    "DecisionSummary": {
     "rule_set_count": 1,
     "rule_group_count": 1,
     "rule_count": 2
    },
    "Meta": {
     "api_version": "v1",
     "response_version": "v1.2",
     "generated_at": "2026-11-08T08:00:00Z"
    },
    "Trace": {
     "allowed_contents": [
      "ZZ_TEST01",
      "ZZ_TEST03"
     ],
     "content_candidates": [
      "ZZ_TEST01"
     ],
     "content_selection": {
      "selected_content_id": "ZZ_TEST01",
      "selection_reason": "Selected the explicitly requested content for the matched country pair and HS scope.",
      "requested_content_id": "ZZ_TEST01"
     },
     "hs_attempts": [
      "9901",
      "99"
     ],
     "hs_resolution": {
      "matched_hs": "99",
      "hs_match_level": 2,
      "fallback_used": true,
      "temporal_fallback": false,
      "specific_rule_sets_outside_date": []
     },
     "rule_set_resolution": {
      "matched_rule_set_count": 1,
      "matched_rule_set_ids": [
       "ZZ_TEST01_HS99-R1"
      ]
     },
     "rule_group_resolution": {
      "matched_rule_group_count": 1
     },
     "rule_resolution": {
      "matched_rule_count": 2
     },
     "text_resolution": {
      "requested_languages": [
       "DE",
       "EN",
       "FR"
      ]
     }
    }
   },
   "recorded_at": "2026-11-08"
  },
  "ZZ_TEMPORAL": {
   "status": 200,
   "body": {
    "Request": {
     "country_from": "XA",
     "country_to": "XB",
     "hs_code": "9902",
     "language": "DE,EN,FR",
     "languages": [
      "DE",
      "EN",
      "FR"
     ],
     "as_of_date": "2024-12-31",
     "content_id": "ZZ_TEST01"
    },
    "Agreement": {
     "ContentId": "ZZ_TEST01",
     "StartCid": "01.01.2020",
     "EndCid": "31.12.9999",
     "ContentDescr": [
      {
       "language": "DE",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01"
      },
      {
       "language": "EN",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01 (EN)"
      },
      {
       "language": "FR",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01 (FR)"
      }
     ],
     "CountryFrom": [
      {
       "ExpCo_isoa2": "XA",
       "ExpCo_descr": "ZZ-Abgangsland A (synthetisch)"
      }
     ],
     "CountryTo": [
      {
       "DestCo_isoa2": "XB",
       "DestCo_descr": "ZZ-Zielland B (synthetisch)"
      }
     ],
     "Tolerances": [
      {
       "Tolfrom": "90",
       "Tolto": "97",
       "Tolval": "15",
       "Tolieflag": "EXCL",
       "Tolwflag": "0",
       "Orcrittol": ""
      }
     ],
     "RuleSets": [
      {
       "Hspos": "99",
       "StartRset": "01.01.2020",
       "EndRset": "31.12.9999",
       "Hsposindx": "1",
       "ExFlag": "1",
       "RuleSetDescr": [
        {
         "language": "DE",
         "DescRset": "ZZ-TEST Warenbeschreibung 99/1"
        },
        {
         "language": "EN",
         "DescRset": "ZZ-TEST Warenbeschreibung 99/1 (EN)"
        },
        {
         "language": "FR",
         "DescRset": "ZZ-TEST Warenbeschreibung 99/1 (FR)"
        }
       ],
       "RuleSetFingerprint": "zz-set-99-1",
       "RuleGroups": [
        {
         "RGroup": "1",
         "RGroupLog": "AND",
         "SubGroupNo": "",
         "StartRgroup": "01.01.2020",
         "EndRgroup": "31.12.9999",
         "RuleGroupDescr": [
          {
           "language": "DE",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 99/1"
          },
          {
           "language": "EN",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 99/1 (EN)"
          },
          {
           "language": "FR",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 99/1 (FR)"
          }
         ],
         "Rules": [
          {
           "RuleNo": "1",
           "RLogic": "AND",
           "RDefinition": "HSRANGE",
           "HsRange": "99XX",
           "Roperator": "EQ",
           "Rpercent": "0",
           "Rtarget": "VOU",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-99-1-g1-r1"
          }
         ]
        }
       ]
      }
     ]
    },
    "DecisionSummary": {
     "rule_set_count": 1,
     "rule_group_count": 1,
     "rule_count": 1
    },
    "Meta": {
     "api_version": "v1",
     "response_version": "v1.2",
     "generated_at": "2026-11-08T08:00:00Z"
    },
    "Trace": {
     "allowed_contents": [
      "ZZ_TEST01",
      "ZZ_TEST03"
     ],
     "content_candidates": [
      "ZZ_TEST01"
     ],
     "content_selection": {
      "selected_content_id": "ZZ_TEST01",
      "selection_reason": "Selected the explicitly requested content for the matched country pair and HS scope.",
      "requested_content_id": "ZZ_TEST01"
     },
     "hs_attempts": [
      "9902",
      "99"
     ],
     "hs_resolution": {
      "matched_hs": "99",
      "hs_match_level": 2,
      "fallback_used": true,
      "temporal_fallback": true,
      "specific_rule_sets_outside_date": [
       {
        "rule_set_id": "ZZ_TEST01_HS9902-R1",
        "hs_number": "9902",
        "rule_subset_no": "1",
        "ex_flag": "0",
        "valid_from": "01.01.2025",
        "valid_to": "31.12.9999",
        "has_rules": true,
        "rules_available_from": "01.01.2025",
        "rules_available_until": ""
       }
      ]
     },
     "rule_set_resolution": {
      "matched_rule_set_count": 1,
      "matched_rule_set_ids": [
       "ZZ_TEST01_HS99-R1"
      ]
     },
     "rule_group_resolution": {
      "matched_rule_group_count": 1
     },
     "rule_resolution": {
      "matched_rule_count": 1
     },
     "text_resolution": {
      "requested_languages": [
       "DE",
       "EN",
       "FR"
      ]
     }
    }
   },
   "recorded_at": "2026-11-08"
  },
  "ZZ_SPECIFIC": {
   "status": 200,
   "body": {
    "Request": {
     "country_from": "XA",
     "country_to": "XB",
     "hs_code": "9902",
     "language": "DE,EN,FR",
     "languages": [
      "DE",
      "EN",
      "FR"
     ],
     "as_of_date": "2025-01-02",
     "content_id": "ZZ_TEST01"
    },
    "Agreement": {
     "ContentId": "ZZ_TEST01",
     "StartCid": "01.01.2020",
     "EndCid": "31.12.9999",
     "ContentDescr": [
      {
       "language": "DE",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01"
      },
      {
       "language": "EN",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01 (EN)"
      },
      {
       "language": "FR",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01 (FR)"
      }
     ],
     "CountryFrom": [
      {
       "ExpCo_isoa2": "XA",
       "ExpCo_descr": "ZZ-Abgangsland A (synthetisch)"
      }
     ],
     "CountryTo": [
      {
       "DestCo_isoa2": "XB",
       "DestCo_descr": "ZZ-Zielland B (synthetisch)"
      }
     ],
     "Tolerances": [
      {
       "Tolfrom": "90",
       "Tolto": "97",
       "Tolval": "15",
       "Tolieflag": "EXCL",
       "Tolwflag": "0",
       "Orcrittol": ""
      }
     ],
     "RuleSets": [
      {
       "Hspos": "9902",
       "StartRset": "01.01.2025",
       "EndRset": "31.12.9999",
       "Hsposindx": "1",
       "ExFlag": "0",
       "RuleSetDescr": [
        {
         "language": "DE",
         "DescRset": "ZZ-TEST Warenbeschreibung 9902/1"
        },
        {
         "language": "EN",
         "DescRset": "ZZ-TEST Warenbeschreibung 9902/1 (EN)"
        },
        {
         "language": "FR",
         "DescRset": "ZZ-TEST Warenbeschreibung 9902/1 (FR)"
        }
       ],
       "RuleSetFingerprint": "zz-set-9902-1",
       "RuleGroups": [
        {
         "RGroup": "1",
         "RGroupLog": "AND",
         "SubGroupNo": "",
         "StartRgroup": "01.01.2025",
         "EndRgroup": "31.12.9999",
         "RuleGroupDescr": [
          {
           "language": "DE",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9902/1"
          },
          {
           "language": "EN",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9902/1 (EN)"
          },
          {
           "language": "FR",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9902/1 (FR)"
          }
         ],
         "Rules": [
          {
           "RuleNo": "1",
           "RLogic": "AND",
           "RDefinition": "HSRANGE",
           "HsRange": "*",
           "Roperator": "LE",
           "Rpercent": "50",
           "Rtarget": "VOU",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-9902-1-g1-r1"
          }
         ]
        }
       ]
      }
     ]
    },
    "DecisionSummary": {
     "rule_set_count": 1,
     "rule_group_count": 1,
     "rule_count": 1
    },
    "Meta": {
     "api_version": "v1",
     "response_version": "v1.2",
     "generated_at": "2026-11-08T08:00:00Z"
    },
    "Trace": {
     "allowed_contents": [
      "ZZ_TEST01",
      "ZZ_TEST03"
     ],
     "content_candidates": [
      "ZZ_TEST01"
     ],
     "content_selection": {
      "selected_content_id": "ZZ_TEST01",
      "selection_reason": "Selected the explicitly requested content for the matched country pair and HS scope.",
      "requested_content_id": "ZZ_TEST01"
     },
     "hs_attempts": [
      "9902",
      "99"
     ],
     "hs_resolution": {
      "matched_hs": "9902",
      "hs_match_level": 4,
      "fallback_used": false,
      "temporal_fallback": false,
      "specific_rule_sets_outside_date": []
     },
     "rule_set_resolution": {
      "matched_rule_set_count": 1,
      "matched_rule_set_ids": [
       "ZZ_TEST01_HS9902-R1"
      ]
     },
     "rule_group_resolution": {
      "matched_rule_group_count": 1
     },
     "rule_resolution": {
      "matched_rule_count": 1
     },
     "text_resolution": {
      "requested_languages": [
       "DE",
       "EN",
       "FR"
      ]
     }
    }
   },
   "recorded_at": "2026-11-08"
  },
  "ZZ_STATE_2026": {
   "status": 200,
   "body": {
    "Request": {
     "country_from": "XA",
     "country_to": "XC",
     "hs_code": "990310",
     "language": "DE,EN,FR",
     "languages": [
      "DE",
      "EN",
      "FR"
     ],
     "as_of_date": "2026-12-31",
     "content_id": "ZZ_TEST02"
    },
    "Agreement": {
     "ContentId": "ZZ_TEST02",
     "StartCid": "01.01.2020",
     "EndCid": "31.12.9999",
     "ContentDescr": [
      {
       "language": "DE",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST02"
      },
      {
       "language": "EN",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST02 (EN)"
      },
      {
       "language": "FR",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST02 (FR)"
      }
     ],
     "CountryFrom": [
      {
       "ExpCo_isoa2": "XA",
       "ExpCo_descr": "ZZ-Abgangsland A (synthetisch)"
      }
     ],
     "CountryTo": [
      {
       "DestCo_isoa2": "XC",
       "DestCo_descr": "ZZ-Zielland C (synthetisch)"
      }
     ],
     "Tolerances": [
      {
       "Tolfrom": "90",
       "Tolto": "97",
       "Tolval": "15",
       "Tolieflag": "EXCL",
       "Tolwflag": "0",
       "Orcrittol": ""
      }
     ],
     "RuleSets": [
      {
       "Hspos": "9903",
       "StartRset": "01.01.2020",
       "EndRset": "31.12.2026",
       "Hsposindx": "1",
       "ExFlag": "0",
       "RuleSetDescr": [
        {
         "language": "DE",
         "DescRset": "ZZ-TEST Warenbeschreibung 9903/1"
        },
        {
         "language": "EN",
         "DescRset": "ZZ-TEST Warenbeschreibung 9903/1 (EN)"
        },
        {
         "language": "FR",
         "DescRset": "ZZ-TEST Warenbeschreibung 9903/1 (FR)"
        }
       ],
       "RuleSetFingerprint": "zz-set-9903-1-2026",
       "RuleGroups": [
        {
         "RGroup": "1",
         "RGroupLog": "AND",
         "SubGroupNo": "",
         "StartRgroup": "01.01.2020",
         "EndRgroup": "31.12.2026",
         "RuleGroupDescr": [
          {
           "language": "DE",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9903/1"
          },
          {
           "language": "EN",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9903/1 (EN)"
          },
          {
           "language": "FR",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9903/1 (FR)"
          }
         ],
         "Rules": [
          {
           "RuleNo": "1",
           "RLogic": "AND",
           "RDefinition": "HSRANGE",
           "HsRange": "*",
           "Roperator": "LE",
           "Rpercent": "45",
           "Rtarget": "VOU",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-9903-1-2026-g1-r1"
          }
         ]
        }
       ]
      }
     ]
    },
    "DecisionSummary": {
     "rule_set_count": 1,
     "rule_group_count": 1,
     "rule_count": 1
    },
    "Meta": {
     "api_version": "v1",
     "response_version": "v1.2",
     "generated_at": "2026-11-08T08:00:00Z"
    },
    "Trace": {
     "allowed_contents": [
      "ZZ_TEST02"
     ],
     "content_candidates": [
      "ZZ_TEST02"
     ],
     "content_selection": {
      "selected_content_id": "ZZ_TEST02",
      "selection_reason": "Selected the explicitly requested content for the matched country pair and HS scope.",
      "requested_content_id": "ZZ_TEST02"
     },
     "hs_attempts": [
      "990310",
      "9903",
      "99"
     ],
     "hs_resolution": {
      "matched_hs": "9903",
      "hs_match_level": 4,
      "fallback_used": true,
      "temporal_fallback": false,
      "specific_rule_sets_outside_date": []
     },
     "rule_set_resolution": {
      "matched_rule_set_count": 1,
      "matched_rule_set_ids": [
       "ZZ_TEST02_HS9903-R1"
      ]
     },
     "rule_group_resolution": {
      "matched_rule_group_count": 1
     },
     "rule_resolution": {
      "matched_rule_count": 1
     },
     "text_resolution": {
      "requested_languages": [
       "DE",
       "EN",
       "FR"
      ]
     }
    }
   },
   "recorded_at": "2026-11-08"
  },
  "ZZ_STATE_2027": {
   "status": 200,
   "body": {
    "Request": {
     "country_from": "XA",
     "country_to": "XC",
     "hs_code": "990310",
     "language": "DE,EN,FR",
     "languages": [
      "DE",
      "EN",
      "FR"
     ],
     "as_of_date": "2027-01-01",
     "content_id": "ZZ_TEST02"
    },
    "Agreement": {
     "ContentId": "ZZ_TEST02",
     "StartCid": "01.01.2020",
     "EndCid": "31.12.9999",
     "ContentDescr": [
      {
       "language": "DE",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST02"
      },
      {
       "language": "EN",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST02 (EN)"
      },
      {
       "language": "FR",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST02 (FR)"
      }
     ],
     "CountryFrom": [
      {
       "ExpCo_isoa2": "XA",
       "ExpCo_descr": "ZZ-Abgangsland A (synthetisch)"
      }
     ],
     "CountryTo": [
      {
       "DestCo_isoa2": "XC",
       "DestCo_descr": "ZZ-Zielland C (synthetisch)"
      }
     ],
     "Tolerances": [
      {
       "Tolfrom": "90",
       "Tolto": "97",
       "Tolval": "15",
       "Tolieflag": "EXCL",
       "Tolwflag": "0",
       "Orcrittol": ""
      }
     ],
     "RuleSets": [
      {
       "Hspos": "9903",
       "StartRset": "01.01.2027",
       "EndRset": "31.12.9999",
       "Hsposindx": "1",
       "ExFlag": "0",
       "RuleSetDescr": [
        {
         "language": "DE",
         "DescRset": "ZZ-TEST Warenbeschreibung 9903/1"
        },
        {
         "language": "EN",
         "DescRset": "ZZ-TEST Warenbeschreibung 9903/1 (EN)"
        },
        {
         "language": "FR",
         "DescRset": "ZZ-TEST Warenbeschreibung 9903/1 (FR)"
        }
       ],
       "RuleSetFingerprint": "zz-set-9903-1-2027",
       "RuleGroups": [
        {
         "RGroup": "1",
         "RGroupLog": "AND",
         "SubGroupNo": "",
         "StartRgroup": "01.01.2027",
         "EndRgroup": "31.12.9999",
         "RuleGroupDescr": [
          {
           "language": "DE",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9903/1"
          },
          {
           "language": "EN",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9903/1 (EN)"
          },
          {
           "language": "FR",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9903/1 (FR)"
          }
         ],
         "Rules": [
          {
           "RuleNo": "1",
           "RLogic": "OR",
           "RDefinition": "HSRANGE",
           "HsRange": "*",
           "Roperator": "LE",
           "Rpercent": "50",
           "Rtarget": "VOU",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-9903-1-2027-g1-r1"
          },
          {
           "RuleNo": "2",
           "RLogic": "OR",
           "RDefinition": "HSRANGE",
           "HsRange": "9999XX",
           "Roperator": "EQ",
           "Rpercent": "0",
           "Rtarget": "VOU",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-9903-1-2027-g1-r2"
          }
         ]
        }
       ]
      }
     ]
    },
    "DecisionSummary": {
     "rule_set_count": 1,
     "rule_group_count": 1,
     "rule_count": 2
    },
    "Meta": {
     "api_version": "v1",
     "response_version": "v1.2",
     "generated_at": "2026-11-08T08:00:00Z"
    },
    "Trace": {
     "allowed_contents": [
      "ZZ_TEST02"
     ],
     "content_candidates": [
      "ZZ_TEST02"
     ],
     "content_selection": {
      "selected_content_id": "ZZ_TEST02",
      "selection_reason": "Selected the explicitly requested content for the matched country pair and HS scope.",
      "requested_content_id": "ZZ_TEST02"
     },
     "hs_attempts": [
      "990310",
      "9903",
      "99"
     ],
     "hs_resolution": {
      "matched_hs": "9903",
      "hs_match_level": 4,
      "fallback_used": true,
      "temporal_fallback": false,
      "specific_rule_sets_outside_date": []
     },
     "rule_set_resolution": {
      "matched_rule_set_count": 1,
      "matched_rule_set_ids": [
       "ZZ_TEST02_HS9903-R1"
      ]
     },
     "rule_group_resolution": {
      "matched_rule_group_count": 1
     },
     "rule_resolution": {
      "matched_rule_count": 2
     },
     "text_resolution": {
      "requested_languages": [
       "DE",
       "EN",
       "FR"
      ]
     }
    }
   },
   "recorded_at": "2026-11-08"
  },
  "ZZ_MULTI": {
   "status": 200,
   "body": {
    "Request": {
     "country_from": "XA",
     "country_to": "XB",
     "hs_code": "9904",
     "language": "DE,EN,FR",
     "languages": [
      "DE",
      "EN",
      "FR"
     ],
     "as_of_date": "2026-11-08",
     "content_id": "ZZ_TEST01"
    },
    "Agreement": {
     "ContentId": "ZZ_TEST01",
     "StartCid": "01.01.2020",
     "EndCid": "31.12.9999",
     "ContentDescr": [
      {
       "language": "DE",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01"
      },
      {
       "language": "EN",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01 (EN)"
      },
      {
       "language": "FR",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01 (FR)"
      }
     ],
     "CountryFrom": [
      {
       "ExpCo_isoa2": "XA",
       "ExpCo_descr": "ZZ-Abgangsland A (synthetisch)"
      }
     ],
     "CountryTo": [
      {
       "DestCo_isoa2": "XB",
       "DestCo_descr": "ZZ-Zielland B (synthetisch)"
      }
     ],
     "Tolerances": [
      {
       "Tolfrom": "90",
       "Tolto": "97",
       "Tolval": "15",
       "Tolieflag": "EXCL",
       "Tolwflag": "0",
       "Orcrittol": ""
      }
     ],
     "RuleSets": [
      {
       "Hspos": "9904",
       "StartRset": "01.01.2020",
       "EndRset": "31.12.9999",
       "Hsposindx": "1",
       "ExFlag": "0",
       "RuleSetDescr": [
        {
         "language": "DE",
         "DescRset": "ZZ-TEST Warenbeschreibung 9904/1"
        },
        {
         "language": "EN",
         "DescRset": "ZZ-TEST Warenbeschreibung 9904/1 (EN)"
        },
        {
         "language": "FR",
         "DescRset": "ZZ-TEST Warenbeschreibung 9904/1 (FR)"
        }
       ],
       "RuleSetFingerprint": "zz-set-9904-1",
       "RuleGroups": [
        {
         "RGroup": "1",
         "RGroupLog": "AND",
         "SubGroupNo": "",
         "StartRgroup": "01.01.2020",
         "EndRgroup": "31.12.9999",
         "RuleGroupDescr": [
          {
           "language": "DE",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9904/1"
          },
          {
           "language": "EN",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9904/1 (EN)"
          },
          {
           "language": "FR",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9904/1 (FR)"
          }
         ],
         "Rules": [
          {
           "RuleNo": "1",
           "RLogic": "AND",
           "RDefinition": "HSRANGE",
           "HsRange": "*",
           "Roperator": "LE",
           "Rpercent": "40",
           "Rtarget": "VOU",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-9904-1-g1-r1"
          }
         ]
        }
       ]
      },
      {
       "Hspos": "9904",
       "StartRset": "01.01.2020",
       "EndRset": "31.12.9999",
       "Hsposindx": "2",
       "ExFlag": "0",
       "RuleSetDescr": [
        {
         "language": "DE",
         "DescRset": "ZZ-TEST Warenbeschreibung 9904/2"
        },
        {
         "language": "EN",
         "DescRset": "ZZ-TEST Warenbeschreibung 9904/2 (EN)"
        },
        {
         "language": "FR",
         "DescRset": "ZZ-TEST Warenbeschreibung 9904/2 (FR)"
        }
       ],
       "RuleSetFingerprint": "zz-set-9904-2",
       "RuleGroups": [
        {
         "RGroup": "1",
         "RGroupLog": "AND",
         "SubGroupNo": "",
         "StartRgroup": "01.01.2020",
         "EndRgroup": "31.12.9999",
         "RuleGroupDescr": [
          {
           "language": "DE",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9904/2"
          },
          {
           "language": "EN",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9904/2 (EN)"
          },
          {
           "language": "FR",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9904/2 (FR)"
          }
         ],
         "Rules": [
          {
           "RuleNo": "1",
           "RLogic": "AND",
           "RDefinition": "HSRANGE",
           "HsRange": "99XX",
           "Roperator": "EQ",
           "Rpercent": "0",
           "Rtarget": "VOU",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-9904-2-g1-r1"
          },
          {
           "RuleNo": "2",
           "RLogic": "AND",
           "RDefinition": "HSRANGE",
           "HsRange": "*",
           "Roperator": "LE",
           "Rpercent": "55",
           "Rtarget": "VOU",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-9904-2-g1-r2"
          }
         ]
        }
       ]
      }
     ]
    },
    "DecisionSummary": {
     "rule_set_count": 2,
     "rule_group_count": 2,
     "rule_count": 3
    },
    "Meta": {
     "api_version": "v1",
     "response_version": "v1.2",
     "generated_at": "2026-11-08T08:00:00Z"
    },
    "Trace": {
     "allowed_contents": [
      "ZZ_TEST01",
      "ZZ_TEST03"
     ],
     "content_candidates": [
      "ZZ_TEST01"
     ],
     "content_selection": {
      "selected_content_id": "ZZ_TEST01",
      "selection_reason": "Selected the explicitly requested content for the matched country pair and HS scope.",
      "requested_content_id": "ZZ_TEST01"
     },
     "hs_attempts": [
      "9904",
      "99"
     ],
     "hs_resolution": {
      "matched_hs": "9904",
      "hs_match_level": 4,
      "fallback_used": false,
      "temporal_fallback": false,
      "specific_rule_sets_outside_date": []
     },
     "rule_set_resolution": {
      "matched_rule_set_count": 2,
      "matched_rule_set_ids": [
       "ZZ_TEST01_HS9904-R1",
       "ZZ_TEST01_HS9904-R2"
      ]
     },
     "rule_group_resolution": {
      "matched_rule_group_count": 2
     },
     "rule_resolution": {
      "matched_rule_count": 3
     },
     "text_resolution": {
      "requested_languages": [
       "DE",
       "EN",
       "FR"
      ]
     }
    }
   },
   "recorded_at": "2026-11-08"
  },
  "ZZ_EX_CANDIDATES": {
   "status": 200,
   "body": {
    "Request": {
     "country_from": "XA",
     "country_to": "XB",
     "hs_code": "9905",
     "language": "DE,EN,FR",
     "languages": [
      "DE",
      "EN",
      "FR"
     ],
     "as_of_date": "2026-11-08",
     "content_id": "ZZ_TEST01"
    },
    "Agreement": {
     "ContentId": "ZZ_TEST01",
     "StartCid": "01.01.2020",
     "EndCid": "31.12.9999",
     "ContentDescr": [
      {
       "language": "DE",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01"
      },
      {
       "language": "EN",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01 (EN)"
      },
      {
       "language": "FR",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01 (FR)"
      }
     ],
     "CountryFrom": [
      {
       "ExpCo_isoa2": "XA",
       "ExpCo_descr": "ZZ-Abgangsland A (synthetisch)"
      }
     ],
     "CountryTo": [
      {
       "DestCo_isoa2": "XB",
       "DestCo_descr": "ZZ-Zielland B (synthetisch)"
      }
     ],
     "Tolerances": [
      {
       "Tolfrom": "90",
       "Tolto": "97",
       "Tolval": "15",
       "Tolieflag": "EXCL",
       "Tolwflag": "0",
       "Orcrittol": ""
      }
     ],
     "RuleSets": [
      {
       "Hspos": "9905",
       "StartRset": "01.01.2020",
       "EndRset": "31.12.9999",
       "Hsposindx": "1",
       "ExFlag": "1",
       "RuleSetDescr": [
        {
         "language": "DE",
         "DescRset": "ZZ-TEST Warenbeschreibung 9905/1"
        },
        {
         "language": "EN",
         "DescRset": "ZZ-TEST Warenbeschreibung 9905/1 (EN)"
        },
        {
         "language": "FR",
         "DescRset": "ZZ-TEST Warenbeschreibung 9905/1 (FR)"
        }
       ],
       "RuleSetFingerprint": "zz-set-9905-1",
       "RuleGroups": [
        {
         "RGroup": "1",
         "RGroupLog": "AND",
         "SubGroupNo": "",
         "StartRgroup": "01.01.2020",
         "EndRgroup": "31.12.9999",
         "RuleGroupDescr": [
          {
           "language": "DE",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9905/1"
          },
          {
           "language": "EN",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9905/1 (EN)"
          },
          {
           "language": "FR",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9905/1 (FR)"
          }
         ],
         "Rules": [
          {
           "RuleNo": "1",
           "RLogic": "AND",
           "RDefinition": "HSRANGE",
           "HsRange": "99XX",
           "Roperator": "EQ",
           "Rpercent": "0",
           "Rtarget": "VOU",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-9905-1-g1-r1"
          }
         ]
        }
       ]
      },
      {
       "Hspos": "9905",
       "StartRset": "01.01.2020",
       "EndRset": "31.12.9999",
       "Hsposindx": "2",
       "ExFlag": "1",
       "RuleSetDescr": [
        {
         "language": "DE",
         "DescRset": "ZZ-TEST Warenbeschreibung 9905/2"
        },
        {
         "language": "EN",
         "DescRset": "ZZ-TEST Warenbeschreibung 9905/2 (EN)"
        },
        {
         "language": "FR",
         "DescRset": "ZZ-TEST Warenbeschreibung 9905/2 (FR)"
        }
       ],
       "RuleSetFingerprint": "zz-set-9905-2",
       "RuleGroups": [
        {
         "RGroup": "1",
         "RGroupLog": "AND",
         "SubGroupNo": "",
         "StartRgroup": "01.01.2020",
         "EndRgroup": "31.12.9999",
         "RuleGroupDescr": [
          {
           "language": "DE",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9905/2"
          },
          {
           "language": "EN",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9905/2 (EN)"
          }
         ],
         "Rules": [
          {
           "RuleNo": "1",
           "RLogic": "AND",
           "RDefinition": "DESCRIPTION",
           "HsRange": "",
           "Roperator": "",
           "Rpercent": "",
           "Rtarget": "",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-9905-2-g1-r1"
          }
         ]
        }
       ]
      }
     ]
    },
    "DecisionSummary": {
     "rule_set_count": 2,
     "rule_group_count": 2,
     "rule_count": 2
    },
    "Meta": {
     "api_version": "v1",
     "response_version": "v1.2",
     "generated_at": "2026-11-08T08:00:00Z"
    },
    "Trace": {
     "allowed_contents": [
      "ZZ_TEST01",
      "ZZ_TEST03"
     ],
     "content_candidates": [
      "ZZ_TEST01"
     ],
     "content_selection": {
      "selected_content_id": "ZZ_TEST01",
      "selection_reason": "Selected the explicitly requested content for the matched country pair and HS scope.",
      "requested_content_id": "ZZ_TEST01"
     },
     "hs_attempts": [
      "9905",
      "99"
     ],
     "hs_resolution": {
      "matched_hs": "9905",
      "hs_match_level": 4,
      "fallback_used": false,
      "temporal_fallback": false,
      "specific_rule_sets_outside_date": []
     },
     "rule_set_resolution": {
      "matched_rule_set_count": 2,
      "matched_rule_set_ids": [
       "ZZ_TEST01_HS9905-R1",
       "ZZ_TEST01_HS9905-R2"
      ]
     },
     "rule_group_resolution": {
      "matched_rule_group_count": 2
     },
     "rule_resolution": {
      "matched_rule_count": 2
     },
     "text_resolution": {
      "requested_languages": [
       "DE",
       "EN",
       "FR"
      ]
     }
    }
   },
   "recorded_at": "2026-11-08"
  },
  "ZZ_FOUR": {
   "status": 200,
   "body": {
    "Request": {
     "country_from": "XA",
     "country_to": "XB",
     "hs_code": "9906",
     "language": "DE,EN,FR",
     "languages": [
      "DE",
      "EN",
      "FR"
     ],
     "as_of_date": "2026-11-08",
     "content_id": "ZZ_TEST01"
    },
    "Agreement": {
     "ContentId": "ZZ_TEST01",
     "StartCid": "01.01.2020",
     "EndCid": "31.12.9999",
     "ContentDescr": [
      {
       "language": "DE",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01"
      },
      {
       "language": "EN",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01 (EN)"
      },
      {
       "language": "FR",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01 (FR)"
      }
     ],
     "CountryFrom": [
      {
       "ExpCo_isoa2": "XA",
       "ExpCo_descr": "ZZ-Abgangsland A (synthetisch)"
      }
     ],
     "CountryTo": [
      {
       "DestCo_isoa2": "XB",
       "DestCo_descr": "ZZ-Zielland B (synthetisch)"
      }
     ],
     "Tolerances": [
      {
       "Tolfrom": "90",
       "Tolto": "97",
       "Tolval": "15",
       "Tolieflag": "EXCL",
       "Tolwflag": "0",
       "Orcrittol": ""
      }
     ],
     "RuleSets": [
      {
       "Hspos": "9906",
       "StartRset": "01.01.2020",
       "EndRset": "31.12.9999",
       "Hsposindx": "1",
       "ExFlag": "0",
       "RuleSetDescr": [
        {
         "language": "DE",
         "DescRset": "ZZ-TEST Warenbeschreibung 9906/1"
        },
        {
         "language": "EN",
         "DescRset": "ZZ-TEST Warenbeschreibung 9906/1 (EN)"
        },
        {
         "language": "FR",
         "DescRset": "ZZ-TEST Warenbeschreibung 9906/1 (FR)"
        }
       ],
       "RuleSetFingerprint": "zz-set-9906-1",
       "RuleGroups": [
        {
         "RGroup": "1",
         "RGroupLog": "OR",
         "SubGroupNo": "",
         "StartRgroup": "01.01.2020",
         "EndRgroup": "31.12.9999",
         "RuleGroupDescr": [
          {
           "language": "DE",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9906/1"
          },
          {
           "language": "EN",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9906/1 (EN)"
          },
          {
           "language": "FR",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9906/1 (FR)"
          }
         ],
         "Rules": [
          {
           "RuleNo": "1",
           "RLogic": "AND",
           "RDefinition": "HSRANGE",
           "HsRange": "*",
           "Roperator": "LE",
           "Rpercent": "50",
           "Rtarget": "VOU",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-9906-1-g1-r1"
          }
         ]
        },
        {
         "RGroup": "2",
         "RGroupLog": "OR",
         "SubGroupNo": "",
         "StartRgroup": "01.01.2020",
         "EndRgroup": "31.12.9999",
         "RuleGroupDescr": [
          {
           "language": "DE",
           "DescRg": "ZZ-TEST Regelgruppe 2 des Regelsatzes 9906/1"
          },
          {
           "language": "EN",
           "DescRg": "ZZ-TEST Regelgruppe 2 des Regelsatzes 9906/1 (EN)"
          },
          {
           "language": "FR",
           "DescRg": "ZZ-TEST Regelgruppe 2 des Regelsatzes 9906/1 (FR)"
          }
         ],
         "Rules": [
          {
           "RuleNo": "1",
           "RLogic": "AND",
           "RDefinition": "HSRANGE",
           "HsRange": "99XX",
           "Roperator": "EQ",
           "Rpercent": "0",
           "Rtarget": "VOU",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-9906-1-g2-r1"
          }
         ]
        },
        {
         "RGroup": "3",
         "RGroupLog": "OR",
         "SubGroupNo": "",
         "StartRgroup": "01.01.2020",
         "EndRgroup": "31.12.9999",
         "RuleGroupDescr": [
          {
           "language": "DE",
           "DescRg": "ZZ-TEST Regelgruppe 3 des Regelsatzes 9906/1"
          },
          {
           "language": "EN",
           "DescRg": "ZZ-TEST Regelgruppe 3 des Regelsatzes 9906/1 (EN)"
          },
          {
           "language": "FR",
           "DescRg": "ZZ-TEST Regelgruppe 3 des Regelsatzes 9906/1 (FR)"
          }
         ],
         "Rules": [
          {
           "RuleNo": "1",
           "RLogic": "AND",
           "RDefinition": "DESCRIPTION",
           "HsRange": "",
           "Roperator": "",
           "Rpercent": "",
           "Rtarget": "",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-9906-1-g3-r1"
          }
         ]
        },
        {
         "RGroup": "4",
         "RGroupLog": "OR",
         "SubGroupNo": "",
         "StartRgroup": "01.01.2020",
         "EndRgroup": "31.12.9999",
         "RuleGroupDescr": [
          {
           "language": "DE",
           "DescRg": "ZZ-TEST Regelgruppe 4 des Regelsatzes 9906/1"
          },
          {
           "language": "EN",
           "DescRg": "ZZ-TEST Regelgruppe 4 des Regelsatzes 9906/1 (EN)"
          },
          {
           "language": "FR",
           "DescRg": "ZZ-TEST Regelgruppe 4 des Regelsatzes 9906/1 (FR)"
          }
         ],
         "Rules": [
          {
           "RuleNo": "1",
           "RLogic": "AND",
           "RDefinition": "HSRANGE",
           "HsRange": "9999XX",
           "Roperator": "EQ",
           "Rpercent": "0",
           "Rtarget": "VOU",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-9906-1-g4-r1"
          }
         ]
        }
       ]
      }
     ]
    },
    "DecisionSummary": {
     "rule_set_count": 1,
     "rule_group_count": 4,
     "rule_count": 4
    },
    "Meta": {
     "api_version": "v1",
     "response_version": "v1.2",
     "generated_at": "2026-11-08T08:00:00Z"
    },
    "Trace": {
     "allowed_contents": [
      "ZZ_TEST01",
      "ZZ_TEST03"
     ],
     "content_candidates": [
      "ZZ_TEST01"
     ],
     "content_selection": {
      "selected_content_id": "ZZ_TEST01",
      "selection_reason": "Selected the explicitly requested content for the matched country pair and HS scope.",
      "requested_content_id": "ZZ_TEST01"
     },
     "hs_attempts": [
      "9906",
      "99"
     ],
     "hs_resolution": {
      "matched_hs": "9906",
      "hs_match_level": 4,
      "fallback_used": false,
      "temporal_fallback": false,
      "specific_rule_sets_outside_date": []
     },
     "rule_set_resolution": {
      "matched_rule_set_count": 1,
      "matched_rule_set_ids": [
       "ZZ_TEST01_HS9906-R1"
      ]
     },
     "rule_group_resolution": {
      "matched_rule_group_count": 4
     },
     "rule_resolution": {
      "matched_rule_count": 4
     },
     "text_resolution": {
      "requested_languages": [
       "DE",
       "EN",
       "FR"
      ]
     }
    }
   },
   "recorded_at": "2026-11-08"
  },
  "ZZ_NESTED": {
   "status": 200,
   "body": {
    "Request": {
     "country_from": "XA",
     "country_to": "XB",
     "hs_code": "9907",
     "language": "DE,EN,FR",
     "languages": [
      "DE",
      "EN",
      "FR"
     ],
     "as_of_date": "2026-11-08",
     "content_id": "ZZ_TEST01"
    },
    "Agreement": {
     "ContentId": "ZZ_TEST01",
     "StartCid": "01.01.2020",
     "EndCid": "31.12.9999",
     "ContentDescr": [
      {
       "language": "DE",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01"
      },
      {
       "language": "EN",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01 (EN)"
      },
      {
       "language": "FR",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01 (FR)"
      }
     ],
     "CountryFrom": [
      {
       "ExpCo_isoa2": "XA",
       "ExpCo_descr": "ZZ-Abgangsland A (synthetisch)"
      }
     ],
     "CountryTo": [
      {
       "DestCo_isoa2": "XB",
       "DestCo_descr": "ZZ-Zielland B (synthetisch)"
      }
     ],
     "Tolerances": [
      {
       "Tolfrom": "90",
       "Tolto": "97",
       "Tolval": "15",
       "Tolieflag": "EXCL",
       "Tolwflag": "0",
       "Orcrittol": ""
      }
     ],
     "RuleSets": [
      {
       "Hspos": "9907",
       "StartRset": "01.01.2020",
       "EndRset": "31.12.9999",
       "Hsposindx": "1",
       "ExFlag": "0",
       "RuleSetDescr": [
        {
         "language": "DE",
         "DescRset": "ZZ-TEST Warenbeschreibung 9907/1"
        },
        {
         "language": "EN",
         "DescRset": "ZZ-TEST Warenbeschreibung 9907/1 (EN)"
        },
        {
         "language": "FR",
         "DescRset": "ZZ-TEST Warenbeschreibung 9907/1 (FR)"
        }
       ],
       "RuleSetFingerprint": "zz-set-9907-1",
       "RuleGroups": [
        {
         "RGroup": "1",
         "RGroupLog": "AND",
         "SubGroupNo": "OR-1",
         "StartRgroup": "01.01.2020",
         "EndRgroup": "31.12.9999",
         "RuleGroupDescr": [
          {
           "language": "DE",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9907/1"
          },
          {
           "language": "EN",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9907/1 (EN)"
          },
          {
           "language": "FR",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9907/1 (FR)"
          }
         ],
         "Rules": [
          {
           "RuleNo": "1",
           "RLogic": "AND",
           "RDefinition": "HSRANGE",
           "HsRange": "99XX",
           "Roperator": "EQ",
           "Rpercent": "0",
           "Rtarget": "VOU",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-9907-1-g1-r1"
          }
         ]
        },
        {
         "RGroup": "2",
         "RGroupLog": "AND",
         "SubGroupNo": "OR-1",
         "StartRgroup": "01.01.2020",
         "EndRgroup": "31.12.9999",
         "RuleGroupDescr": [
          {
           "language": "DE",
           "DescRg": "ZZ-TEST Regelgruppe 2 des Regelsatzes 9907/1"
          },
          {
           "language": "EN",
           "DescRg": "ZZ-TEST Regelgruppe 2 des Regelsatzes 9907/1 (EN)"
          },
          {
           "language": "FR",
           "DescRg": "ZZ-TEST Regelgruppe 2 des Regelsatzes 9907/1 (FR)"
          }
         ],
         "Rules": [
          {
           "RuleNo": "1",
           "RLogic": "AND",
           "RDefinition": "DESCRIPTION",
           "HsRange": "",
           "Roperator": "",
           "Rpercent": "",
           "Rtarget": "",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-9907-1-g2-r1"
          },
          {
           "RuleNo": "2",
           "RLogic": "AND",
           "RDefinition": "HSRANGE",
           "HsRange": "*",
           "Roperator": "LE",
           "Rpercent": "40",
           "Rtarget": "VOU",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-9907-1-g2-r2"
          }
         ]
        },
        {
         "RGroup": "3",
         "RGroupLog": "AND",
         "SubGroupNo": "",
         "StartRgroup": "01.01.2020",
         "EndRgroup": "31.12.9999",
         "RuleGroupDescr": [
          {
           "language": "DE",
           "DescRg": "ZZ-TEST Regelgruppe 3 des Regelsatzes 9907/1"
          },
          {
           "language": "EN",
           "DescRg": "ZZ-TEST Regelgruppe 3 des Regelsatzes 9907/1 (EN)"
          },
          {
           "language": "FR",
           "DescRg": "ZZ-TEST Regelgruppe 3 des Regelsatzes 9907/1 (FR)"
          }
         ],
         "Rules": [
          {
           "RuleNo": "1",
           "RLogic": "AND",
           "RDefinition": "HSRANGE",
           "HsRange": "*",
           "Roperator": "LE",
           "Rpercent": "50",
           "Rtarget": "VOU",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-9907-1-g3-r1"
          }
         ]
        }
       ]
      }
     ]
    },
    "DecisionSummary": {
     "rule_set_count": 1,
     "rule_group_count": 3,
     "rule_count": 4
    },
    "Meta": {
     "api_version": "v1",
     "response_version": "v1.2",
     "generated_at": "2026-11-08T08:00:00Z"
    },
    "Trace": {
     "allowed_contents": [
      "ZZ_TEST01",
      "ZZ_TEST03"
     ],
     "content_candidates": [
      "ZZ_TEST01"
     ],
     "content_selection": {
      "selected_content_id": "ZZ_TEST01",
      "selection_reason": "Selected the explicitly requested content for the matched country pair and HS scope.",
      "requested_content_id": "ZZ_TEST01"
     },
     "hs_attempts": [
      "9907",
      "99"
     ],
     "hs_resolution": {
      "matched_hs": "9907",
      "hs_match_level": 4,
      "fallback_used": false,
      "temporal_fallback": false,
      "specific_rule_sets_outside_date": []
     },
     "rule_set_resolution": {
      "matched_rule_set_count": 1,
      "matched_rule_set_ids": [
       "ZZ_TEST01_HS9907-R1"
      ]
     },
     "rule_group_resolution": {
      "matched_rule_group_count": 3
     },
     "rule_resolution": {
      "matched_rule_count": 4
     },
     "text_resolution": {
      "requested_languages": [
       "DE",
       "EN",
       "FR"
      ]
     }
    }
   },
   "recorded_at": "2026-11-08"
  },
  "ZZ_AUTO": {
   "status": 200,
   "body": {
    "Request": {
     "country_from": "XA",
     "country_to": "XB",
     "hs_code": "9908",
     "language": "DE,EN,FR",
     "languages": [
      "DE",
      "EN",
      "FR"
     ],
     "as_of_date": "2026-11-08"
    },
    "Agreement": {
     "ContentId": "ZZ_TEST01",
     "StartCid": "01.01.2020",
     "EndCid": "31.12.9999",
     "ContentDescr": [
      {
       "language": "DE",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01"
      },
      {
       "language": "EN",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01 (EN)"
      },
      {
       "language": "FR",
       "DescAg": "ZZ-TEST Abkommen ZZ_TEST01 (FR)"
      }
     ],
     "CountryFrom": [
      {
       "ExpCo_isoa2": "XA",
       "ExpCo_descr": "ZZ-Abgangsland A (synthetisch)"
      }
     ],
     "CountryTo": [
      {
       "DestCo_isoa2": "XB",
       "DestCo_descr": "ZZ-Zielland B (synthetisch)"
      }
     ],
     "Tolerances": [
      {
       "Tolfrom": "90",
       "Tolto": "97",
       "Tolval": "15",
       "Tolieflag": "EXCL",
       "Tolwflag": "0",
       "Orcrittol": ""
      }
     ],
     "RuleSets": [
      {
       "Hspos": "9908",
       "StartRset": "01.01.2020",
       "EndRset": "31.12.9999",
       "Hsposindx": "1",
       "ExFlag": "0",
       "RuleSetDescr": [
        {
         "language": "DE",
         "DescRset": "ZZ-TEST Warenbeschreibung 9908/1"
        },
        {
         "language": "EN",
         "DescRset": "ZZ-TEST Warenbeschreibung 9908/1 (EN)"
        },
        {
         "language": "FR",
         "DescRset": "ZZ-TEST Warenbeschreibung 9908/1 (FR)"
        }
       ],
       "RuleSetFingerprint": "zz-set-9908-1",
       "RuleGroups": [
        {
         "RGroup": "1",
         "RGroupLog": "AND",
         "SubGroupNo": "",
         "StartRgroup": "01.01.2020",
         "EndRgroup": "31.12.9999",
         "RuleGroupDescr": [
          {
           "language": "DE",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9908/1"
          },
          {
           "language": "EN",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9908/1 (EN)"
          },
          {
           "language": "FR",
           "DescRg": "ZZ-TEST Regelgruppe 1 des Regelsatzes 9908/1 (FR)"
          }
         ],
         "Rules": [
          {
           "RuleNo": "1",
           "RLogic": "AND",
           "RDefinition": "NO_RESTRICTION",
           "HsRange": "",
           "Roperator": "",
           "Rpercent": "",
           "Rtarget": "",
           "Rproof": "TOP",
           "ProofAlt": "",
           "WeightR": "0",
           "Rorcrit": "",
           "RuleFingerprint": "zz-rule-9908-1-g1-r1"
          }
         ]
        }
       ]
      }
     ]
    },
    "DecisionSummary": {
     "rule_set_count": 1,
     "rule_group_count": 1,
     "rule_count": 1
    },
    "Meta": {
     "api_version": "v1",
     "response_version": "v1.2",
     "generated_at": "2026-11-08T08:00:00Z"
    },
    "Trace": {
     "allowed_contents": [
      "ZZ_TEST01",
      "ZZ_TEST03"
     ],
     "content_candidates": [
      "ZZ_TEST01",
      "ZZ_TEST03"
     ],
     "content_selection": {
      "selected_content_id": "ZZ_TEST01",
      "selection_reason": "Selected best deterministic content candidate for the matched country pair and HS scope.",
      "requested_content_id": null
     },
     "hs_attempts": [
      "9908",
      "99"
     ],
     "hs_resolution": {
      "matched_hs": "9908",
      "hs_match_level": 4,
      "fallback_used": false,
      "temporal_fallback": false,
      "specific_rule_sets_outside_date": []
     },
     "rule_set_resolution": {
      "matched_rule_set_count": 1,
      "matched_rule_set_ids": [
       "ZZ_TEST01_HS9908-R1"
      ]
     },
     "rule_group_resolution": {
      "matched_rule_group_count": 1
     },
     "rule_resolution": {
      "matched_rule_count": 1
     },
     "text_resolution": {
      "requested_languages": [
       "DE",
       "EN",
       "FR"
      ]
     }
    }
   },
   "recorded_at": "2026-11-08"
  },
  "ZZ_BEFORE_DATA": {
   "status": 404,
   "body": {
    "error": {
     "code": "OPT-RULE-001",
     "message": "No matching rule found",
     "details": {
      "country_from": "XA",
      "country_to": "XC",
      "hs_attempts": [
       "990310",
       "9903",
       "99"
      ],
      "allowed_contents": [
       "ZZ_TEST02"
      ],
      "requested_content_id": "ZZ_TEST02"
     }
    }
   },
   "recorded_at": "2026-11-08"
  },
  "ZZ_ERR_MISSING_HS": {
   "status": 400,
   "body": {
    "error": {
     "code": "OPT-REQ-001",
     "message": "Missing required fields",
     "details": {
      "missing_fields": [
       "hs_code"
      ]
     }
    }
   },
   "recorded_at": "2026-11-08"
  },
  "ZZ_ERR_NO_RELATION": {
   "status": 404,
   "body": {
    "error": {
     "code": "OPT-RULE-001",
     "message": "No matching rule found",
     "details": {
      "country_from": "XD",
      "country_to": "XB",
      "hs_attempts": [
       "9901",
       "99"
      ],
      "allowed_contents": []
     }
    }
   },
   "recorded_at": "2026-11-08"
  },
  "ZZ_ERR_UNKNOWN_HS": {
   "status": 404,
   "body": {
    "error": {
     "code": "OPT-RULE-001",
     "message": "No matching rule found",
     "details": {
      "country_from": "XA",
      "country_to": "XB",
      "hs_attempts": [
       "9999",
       "99"
      ],
      "allowed_contents": [
       "ZZ_TEST01",
       "ZZ_TEST03"
      ],
      "requested_content_id": "ZZ_TEST01"
     }
    }
   },
   "recorded_at": "2026-11-08"
  },
  "__agreements__": {
   "status": 200,
   "body": {
    "api_version": "v1",
    "response_version": "v1.0",
    "language": "DE",
    "agreements": [
     {
      "content_id": "ZZ_TEST01",
      "description": "ZZ-TEST Abkommen ZZ_TEST01 (synthetisch)",
      "valid_from": "2020-01-01",
      "valid_to": "9999-12-31",
      "country_from": [
       {
        "iso2": "XA",
        "name": "ZZ-Abgangsland A (synthetisch)"
       }
      ],
      "country_to": [
       {
        "iso2": "XB",
        "name": "ZZ-Zielland B (synthetisch)"
       }
      ],
      "source_preference_space_id": "ZZ_TST",
      "source_preference_space_label": null,
      "target_preference_space_id": "ZZ_TST",
      "target_preference_space_label": null
     },
     {
      "content_id": "ZZ_TEST02",
      "description": "ZZ-TEST Abkommen ZZ_TEST02 (synthetisch)",
      "valid_from": "2020-01-01",
      "valid_to": "9999-12-31",
      "country_from": [
       {
        "iso2": "XA",
        "name": "ZZ-Abgangsland A (synthetisch)"
       }
      ],
      "country_to": [
       {
        "iso2": "XC",
        "name": "ZZ-Zielland C (synthetisch)"
       }
      ],
      "source_preference_space_id": "ZZ_TST",
      "source_preference_space_label": null,
      "target_preference_space_id": "ZZ_TST",
      "target_preference_space_label": null
     },
     {
      "content_id": "ZZ_TEST03",
      "description": "ZZ-TEST Abkommen ZZ_TEST03 (synthetisch)",
      "valid_from": "2020-01-01",
      "valid_to": "9999-12-31",
      "country_from": [
       {
        "iso2": "XA",
        "name": "ZZ-Abgangsland A (synthetisch)"
       }
      ],
      "country_to": [
       {
        "iso2": "XB",
        "name": "ZZ-Zielland B (synthetisch)"
       }
      ],
      "source_preference_space_id": "ZZ_TST",
      "source_preference_space_label": null,
      "target_preference_space_id": "ZZ_TST",
      "target_preference_space_label": null
     }
    ]
   },
   "recorded_at": "2026-11-08"
  }
 }
};
