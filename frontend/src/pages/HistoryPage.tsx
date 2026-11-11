import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  deleteTrashItem,
  getTrash,
  itemKey,
  restoreTrashItem,
  type RestoredItem,
  type TrashItem,
} from "../services/trash";
import DeletedItemList from "../components/history/DeletedItemList";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import CardTitle from "../components/ui/CardTitle";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import Spinner from "../components/ui/Spinner";

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

// Link to a restored item: the requirement, or its scenarios / test cases step
const restoredLink = (item: RestoredItem) =>
  `/projects/${item.projectId}/requirements/${item.requirementNumber}${
    item.type === "scenario" ? "?step=scenarios" : item.type === "testCase" ? "?step=testCases" : ""
  }`;

// For now: "Recently deleted" (items kept for 7 days).
// The full generation history across projects comes in M3.
function HistoryPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<TrashItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [restored, setRestored] = useState<RestoredItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TrashItem | null>(null);

  useEffect(() => {
    getTrash()
      .then(setItems)
      .catch((error) => setError(errorText(error)));
  }, []);

  // Runs an action on one item, then removes it from the list
  const act = async (item: TrashItem, action: () => Promise<void>) => {
    setBusyKey(itemKey(item));
    setError(null);
    setRestored(null);

    try {
      await action();
      setItems((current) => current?.filter((other) => itemKey(other) !== itemKey(item)) ?? null);
    } catch (error) {
      console.error("Recently deleted action failed:", error);
      setError(errorText(error));
    } finally {
      setBusyKey(null);
    }
  };

  const handleRestore = (item: TrashItem) =>
    act(item, async () => {
      setRestored(await restoreTrashItem(item.type, item.id));
    });

  const handleDeleteForever = (item: TrashItem) => {
    setConfirmDelete(null);
    act(item, () => deleteTrashItem(item.type, item.id));
  };

  return (
    <main className="space-y-5">
      <PageHeader eyebrow={t("nav.history")} title={t("historyPage.title")} />

      <Card padding="md">
        <CardTitle aside={items?.length}>{t("recentlyDeleted.title")}</CardTitle>
        <p className="mt-1 text-sm text-gray-500">{t("recentlyDeleted.description")}</p>

        {restored && (
          <p className="mt-4 rounded-xl bg-success/10 px-3 py-2 text-sm text-success">
            {t("recentlyDeleted.restored")}{" "}
            <Link to={restoredLink(restored)} className="font-medium underline">
              {t("recentlyDeleted.open")}
            </Link>
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        {!items && !error && <Spinner className="mt-4" label={t("common.loading")} />}

        {items?.length === 0 && (
          <p className="mt-4 text-sm text-gray-500">{t("recentlyDeleted.empty")}</p>
        )}

        {items && items.length > 0 && (
          <div className="mt-2">
            <DeletedItemList
              items={items}
              busyKey={busyKey}
              onRestore={handleRestore}
              onDeleteForever={setConfirmDelete}
            />
          </div>
        )}
      </Card>

      <p className="text-sm text-gray-500">{t("historyPage.moreSoon")}</p>

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title={t("recentlyDeleted.confirmTitle")}
        description={t("recentlyDeleted.confirmText", { title: confirmDelete?.title ?? "" })}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={() => confirmDelete && handleDeleteForever(confirmDelete)}>
              {t("recentlyDeleted.deleteForever")}
            </Button>
          </>
        }
      />
    </main>
  );
}

export default HistoryPage;
