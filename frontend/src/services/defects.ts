import { request } from "./http";
import { formatDefectCode } from "./requirements";

// Defects (Slice 6), logged under the Step 3 test-case table
export const DEFECT_SEVERITIES = ["CRITICAL", "MAJOR", "MINOR", "TRIVIAL"] as const;
export const DEFECT_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export const DEFECT_STATUSES = ["OPEN", "IN_PROGRESS", "FIXED", "CLOSED"] as const;

export type DefectSeverity = (typeof DEFECT_SEVERITIES)[number];
export type DefectPriority = (typeof DEFECT_PRIORITIES)[number];
export type DefectStatus = (typeof DEFECT_STATUSES)[number];

export type DefectImage = {
  id: number;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type Defect = {
  id: number;
  number: number; // shown as DEF-1
  title: string;
  severity: DefectSeverity;
  priority: DefectPriority;
  status: DefectStatus;
  openedOn: string; // "YYYY-MM-DD"
  closedOn: string | null;
  notes: string;
  // The linked test case (TC number), and whether it's in Recently deleted
  testCaseNumber: number | null;
  testCaseDeleted: boolean;
  images: DefectImage[];
};

// What the form sends (every field optional on an edit)
export type DefectInput = Partial<
  Pick<Defect, "title" | "severity" | "priority" | "status" | "openedOn" | "closedOn" | "notes" | "testCaseNumber">
>;

// Not fixed or closed yet
export const isOpenDefect = (defect: Defect) => defect.status === "OPEN" || defect.status === "IN_PROGRESS";

export { formatDefectCode };

// Today where the tester is, as "YYYY-MM-DD"
export function todayIso() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// "2026-11-14" → "14 Nov 2026" / "14 พ.ย. 2569" in the interface language
export function formatDefectDate(value: string | null, language: string) {
  return value
    ? new Date(`${value}T00:00:00`).toLocaleDateString(language, { day: "numeric", month: "short", year: "numeric" })
    : "—";
}

const base = (projectId: number, requirementNumber: number) =>
  `/api/projects/${projectId}/requirements/${requirementNumber}/defects`;

export function getDefects(projectId: number, requirementNumber: number) {
  return request<Defect[]>(base(projectId, requirementNumber));
}

export function createDefect(projectId: number, requirementNumber: number, input: DefectInput) {
  return request<Defect>(base(projectId, requirementNumber), { method: "POST", body: input });
}

export function updateDefect(projectId: number, requirementNumber: number, number: number, changes: DefectInput) {
  return request<Defect>(`${base(projectId, requirementNumber)}/${number}`, { method: "PATCH", body: changes });
}

// → Recently deleted (7 days)
export function deleteDefect(projectId: number, requirementNumber: number, number: number) {
  return request<void>(`${base(projectId, requirementNumber)}/${number}`, { method: "DELETE" });
}
