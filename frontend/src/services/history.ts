import { request } from "./http";
import type { GenerationStatus } from "./requirements";

// History → "Generated": finished AI generations across all my projects
export type GenerationKind = "SCENARIOS" | "TEST_CASES";

// One click on Draft / Generate more / Generate test cases. Test cases come in
// batches (one AI run each); a click's runs are combined into one item.
export type GenerationHistoryItem = {
  id: number;
  runIds: number[];
  kind: GenerationKind;
  status: Exclude<GenerationStatus, "FAILED">;
  // Scenario runs: "replace" (Draft) or "more" (Generate more)
  mode: "replace" | "more" | null;
  itemCount: number;
  createdAt: string;
  projectId: number;
  projectName: string;
  requirementNumber: number;
  requirementTitle: string;
};

export function getGenerations(kind?: GenerationKind) {
  return request<GenerationHistoryItem[]>(
    `/api/history/generations${kind ? `?kind=${kind}` : ""}`
  );
}
