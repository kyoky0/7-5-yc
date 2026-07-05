export interface PatternMatch {
  term: string;
  category: string;
}

const PERCENT_RE = /\d+(\.\d+)?\s?%/g;
const ISO_DATE_RE = /\b\d{4}-\d{2}-\d{2}\b/g;
const CURRENCY_RE = /\$\d[\d,]*(?:\.\d{1,2})?[MBK]?/gi;
const PATENT_RE = /\b(?:patent|IP|PCT)\s*(?:#|no\.?|number)?\s*[A-Z0-9][A-Z0-9/-]*/gi;
const BUDGET_RE = /\b\d[\d,]*\s*(?:million|billion|M|B|K)\b/gi;
const EMPLOYEE_RE = /\b(?:Dr\.|Mr\.|Ms\.|CEO|CTO|VP|Director)\s+[A-Z][a-z]+/g;
const DEADLINE_RE = /\b(?:Q[1-4])\s*\d{4}\b/gi;

const SENSITIVE_KEYWORDS = [
  "proprietary", "confidential", "internal deadline", "patent pending",
  "budget", "allocated", "partnership with",
];

export function findPatternMatches(text: string): PatternMatch[] {
  const matches: PatternMatch[] = [];
  const collect = (re: RegExp, category: string) => {
    for (const m of text.matchAll(re)) matches.push({ term: m[0], category });
  };

  collect(PERCENT_RE, "percentage");
  collect(ISO_DATE_RE, "exact_date");
  collect(CURRENCY_RE, "currency_amount");
  collect(PATENT_RE, "patent_reference");
  collect(BUDGET_RE, "budget_figure");
  collect(EMPLOYEE_RE, "person_name");
  collect(DEADLINE_RE, "deadline");

  const lower = text.toLowerCase();
  for (const keyword of SENSITIVE_KEYWORDS) {
    if (lower.includes(keyword)) matches.push({ term: keyword, category: "sensitive_keyword" });
  }

  return matches;
}
