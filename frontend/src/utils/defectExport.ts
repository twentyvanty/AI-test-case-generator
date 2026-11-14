import { formatDefectCode, type Defect } from "../services/defects";
import { formatRequirementCode, formatTestCaseCode } from "../services/requirements";
import { downloadFile, toCsv } from "./download";

// label: translates a severity / priority / status for the CSV ("Critical", "วิกฤต"…)
export function downloadDefects(
  requirementNumber: number,
  defects: Defect[],
  label: (kind: "severities" | "priorities" | "statuses", value: string) => string
) {
  downloadFile(
    `${formatRequirementCode(requirementNumber)}-defects.csv`,
    toCsv([
      ["ID", "Defect", "Test case", "Severity", "Priority", "Status", "Open date", "Close date", "Notes", "Images"],
      ...defects.map((defect) => [
        formatDefectCode(defect.number),
        defect.title,
        defect.testCaseNumber === null ? "" : formatTestCaseCode(defect.testCaseNumber),
        label("severities", defect.severity),
        label("priorities", defect.priority),
        label("statuses", defect.status),
        defect.openedOn,
        defect.closedOn ?? "",
        defect.notes,
        defect.images.map((image) => image.fileName).join(", "),
      ]),
    ])
  );
}
