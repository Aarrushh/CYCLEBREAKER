# Eligibility Rules DSL

Goal: encode program/grant requirements as machine-evaluable rules, using a simple JSON logic structure that’s explainable and can be auto-suggested by models then reviewed by humans.

Shape (conceptual)
- Rule = { all?: Rule[], any?: Rule[], not?: Rule, op?: string, field?: string, value?: any, note?: string }
- Primitive comparisons: in, not_in, ==, !=, >=, <=, >, <, regex, contains.

Examples
1) Age >= 18 and Country in [US, CA]
{
  "all": [
    {"op": ">=", "field": "demographics.age", "value": 18, "note": "Minimum age"},
    {"op": "in", "field": "location.country", "value": ["US", "CA"]}
  ]
}

2) For UK residents only and income below threshold
{
  "all": [
    {"op": "==", "field": "location.country", "value": "UK"},
    {"op": "<=", "field": "demographics.annualIncomeGBP", "value": 30000}
  ]
}

Explainability
- When a rule triggers a match or failure for a user, expose the human-readable note and the evaluated values to the user (without leaking sensitive internals).

Extraction
- DeepSeek proposes initial rules from the text; a reviewer validates; store alongside the Opportunity.

