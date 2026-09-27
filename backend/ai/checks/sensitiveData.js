import { fromIssues } from "./result.js";

// Real-looking secrets must never appear in generated test content → fail.
const SECRET_PATTERNS = [
  { name: "Google API key", pattern: /AIza[0-9A-Za-z_-]{35}/ },
  { name: "OpenAI/Anthropic-style API key", pattern: /\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{20,}/ },
  { name: "AWS access key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "GitHub token", pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
  { name: "Slack token", pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}/ },
  { name: "JSON Web Token", pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: "private key", pattern: /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/ },
];

// Emails on these domains are fine as test data (RFC 2606 + common test domains)
const SAFE_EMAIL_DOMAIN =
  /(^|\.)(example\.(com|org|net)|test|example|invalid|localhost|test\.com|mailinator\.com)$/i;

// Well-known card numbers published for testing by payment providers
const TEST_CARDS = new Set([
  "4111111111111111", "4242424242424242", "4000056655665556", "4012888888881881",
  "5555555555554444", "5105105105105100", "2223003122003222", "378282246310005",
  "371449635398431", "6011111111111117", "3056930009020004", "3566002020360505",
  "4000000000000002", "4000000000009995", "4000000000000069", "4000000000000127",
]);

function luhnValid(digits) {
  let sum = 0;

  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i]);

    if (i % 2 === 1) {
      digit *= 2;

      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
  }

  return sum % 10 === 0;
}

// Thai national ID: 13 digits, last one is a checksum
function thaiIdValid(digits) {
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    sum += Number(digits[i]) * (13 - i);
  }

  return (11 - (sum % 11)) % 10 === Number(digits[12]);
}

const allSameDigit = (digits) => /^(\d)\1+$/.test(digits);

// Every string anywhere in the AI output
function collectStrings(value, out = []) {
  if (typeof value === "string") {
    out.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, out));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectStrings(item, out));
  }

  return out;
}

const preview = (value) => (value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value);

export function checkSensitiveData(output) {
  const text = collectStrings(output).join("\n");
  const failures = [];
  const warnings = [];

  for (const { name, pattern } of SECRET_PATTERNS) {
    const match = text.match(pattern);

    if (match) {
      failures.push(`Looks like a real ${name} (${preview(match[0])}) — use an obvious placeholder instead`);
    }
  }

  for (const [, , domain] of text.matchAll(/([A-Z0-9._%+-]+)@([A-Z0-9.-]+\.[A-Z]{2,})/gi)) {
    if (!SAFE_EMAIL_DOMAIN.test(domain)) {
      warnings.push(`Email on a real domain (@${domain}) — prefer @example.com in test data`);
    }
  }

  for (const [raw] of text.matchAll(/\b\d(?:[ -]?\d){12,18}\b/g)) {
    const digits = raw.replace(/\D/g, "");

    if (allSameDigit(digits)) {
      continue;
    }

    if (digits.length >= 13 && digits.length <= 19 && luhnValid(digits) && !TEST_CARDS.has(digits)) {
      warnings.push(`Possible real card number (${preview(digits)}) — use a published test card instead`);
    } else if (digits.length === 13 && thaiIdValid(digits)) {
      warnings.push(`Possible real Thai national ID (${preview(digits)}) — use an obviously fake value`);
    }
  }

  return fromIssues({
    failures: [...new Set(failures)],
    warnings: [...new Set(warnings)],
  });
}
