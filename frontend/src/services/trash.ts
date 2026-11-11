import { request } from "./http";

// "Recently deleted": deleted requirements, scenarios and test cases, kept for 7 days
export type TrashType = "requirement" | "scenario" | "testCase";

export type TrashItem = {
  type: TrashType;
  id: number;
  title: string;
  deletedAt: string;
  purgeAt: string;
  daysLeft: number;
  projectId: number;
  projectName: string;
  requirementNumber: number;
  requirementTitle: string;
  scenarioNumber: number | null;
  testCaseNumber: number | null;
  // Scenarios: test cases deleted together with it (they come back with it)
  testCaseCount: number;
};

// Where a restored item lives now
export type RestoredItem = {
  type: TrashType;
  projectId: number;
  requirementNumber: number;
  scenarioNumber: number | null;
  testCaseNumber: number | null;
};

export function getTrash() {
  return request<TrashItem[]>("/api/trash");
}

export function restoreTrashItem(type: TrashType, id: number) {
  return request<RestoredItem>(`/api/trash/${type}/${id}/restore`, { method: "POST" });
}

export function deleteTrashItem(type: TrashType, id: number) {
  return request<void>(`/api/trash/${type}/${id}`, { method: "DELETE" });
}

// A unique key for an item: "scenario:12"
export const itemKey = (item: Pick<TrashItem, "type" | "id">) => `${item.type}:${item.id}`;
