import {
  summarizeCoverage,
  type Requirement,
} from "../services/requirements";

// Saves text content as a file in the user's downloads
export function downloadFile(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  // Give the browser a moment to start the download before freeing the URL
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

// One row per test case — opens in Excel / Google Sheets
export function testCasesToCsv(requirement: Requirement) {
  const header = [
    "Requirement",
    "Scenario",
    "ID",
    "Title",
    "Precondition",
    "Steps",
    "Expected result",
    "Status",
  ];

  const rows = requirement.scenarios.flatMap((scenario) =>
    scenario.cases.map((testCase) => [
      requirement.id,
      scenario.title,
      testCase.id,
      testCase.title,
      testCase.precondition,
      testCase.steps.map((step, index) => `${index + 1}. ${step}`).join("\n"),
      testCase.expectedResult,
      testCase.status,
    ])
  );

  // BOM so Excel opens UTF-8 (Thai text) correctly
  return "﻿" + [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function coverageReportToMarkdown(requirement: Requirement) {
  const coverage = summarizeCoverage(requirement.scenarios);

  const lines = [
    `# Coverage & traceability report — ${requirement.id}`,
    "",
    `**Requirement:** ${requirement.title}`,
    "",
    `> ${requirement.text}`,
    "",
    `- Coverage: **${coverage.percent}%**`,
    `- Mapped cases: ${coverage.mappedCases}`,
    `- Passed cases: ${coverage.passedCases}`,
    `- Failing cases: ${coverage.failingCases}`,
    "",
    "## By scenario",
    "",
    "| Scenario | Passed | Total |",
    "|---|---|---|",
    ...coverage.areas.map((area) => `| ${area.label} | ${area.passed} | ${area.total} |`),
    "",
    "## Test cases",
    "",
    "| ID | Title | Status |",
    "|---|---|---|",
    ...requirement.scenarios.flatMap((scenario) =>
      scenario.cases.map((item) => `| ${item.id} | ${item.title} | ${item.status} |`)
    ),
    "",
  ];

  return lines.join("\n");
}
