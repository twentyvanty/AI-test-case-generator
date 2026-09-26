// "Commerce application" → "COMMERCE-APPLICATION"
export function toProjectKey(name: string) {
  return (
    name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9ก-๙]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "PROJECT"
  );
}

const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

// "2 hours ago", "yesterday", "2 ชั่วโมงที่ผ่านมา" … in the given language
export function formatRelativeTime(date: string | Date, language: string) {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  const formatter = new Intl.RelativeTimeFormat(language, { numeric: "auto" });

  for (const [unit, unitSeconds] of units) {
    if (Math.abs(seconds) >= unitSeconds) {
      return formatter.format(Math.round(seconds / unitSeconds), unit);
    }
  }

  return formatter.format(0, "minute");
}
