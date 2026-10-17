import { useTranslation } from "react-i18next";
import { formatRequirementCode, formatScenarioCode } from "../../services/requirements";
import { itemKey, type TrashItem } from "../../services/trash";
import { formatRelativeTime } from "../../utils/format";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

type DeletedItemListProps = {
  items: TrashItem[];
  // "type:id" of the item being restored/deleted right now
  busyKey: string | null;
  onRestore: (item: TrashItem) => void;
  onDeleteForever: (item: TrashItem) => void;
};

function DeletedItemList({ items, busyKey, onRestore, onDeleteForever }: DeletedItemListProps) {
  const { t, i18n } = useTranslation();

  return (
    <ul className="divide-y divide-gray-200/80">
      {items.map((item) => {
        const code =
          item.type === "scenario"
            ? `${formatRequirementCode(item.requirementNumber)} · ${formatScenarioCode(item.scenarioNumber ?? 0)}`
            : formatRequirementCode(item.requirementNumber);
        const busy = busyKey === itemKey(item);

        return (
          <li key={itemKey(item)} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-mono text-xs text-gray-500">
                <Badge tone={item.type === "requirement" ? "info" : "neutral"}>
                  {t(`recentlyDeleted.type.${item.type}`)}
                </Badge>
                {code}
              </p>
              <p className="mt-1 font-semibold text-ink">{item.title}</p>
              <p className="mt-0.5 text-sm text-gray-500">
                {item.type === "scenario"
                  ? t("recentlyDeleted.inRequirement", {
                      requirement: item.requirementTitle,
                      project: item.projectName,
                    })
                  : t("recentlyDeleted.inProject", { project: item.projectName })}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {t("recentlyDeleted.deleted", {
                  time: formatRelativeTime(item.deletedAt, i18n.language),
                })}
                {" · "}
                <span className={item.daysLeft <= 1 ? "text-danger" : undefined}>
                  {t("recentlyDeleted.daysLeft", { count: item.daysLeft })}
                </span>
              </p>
            </div>

            <div className="flex gap-1.5">
              <Button variant="secondary" size="sm" onClick={() => onRestore(item)} disabled={busyKey !== null}>
                {busy ? t("recentlyDeleted.working") : t("recentlyDeleted.restore")}
              </Button>
              <Button variant="danger" size="sm" onClick={() => onDeleteForever(item)} disabled={busyKey !== null}>
                {t("recentlyDeleted.deleteForever")}
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default DeletedItemList;
