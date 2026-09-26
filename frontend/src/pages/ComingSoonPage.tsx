import { useTranslation } from "react-i18next";
import Card from "../components/ui/Card";

// Temporary page for sections whose design isn't ready yet
function ComingSoonPage({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();

  return (
    <main className="space-y-4">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-ink">
        {t(titleKey)}
      </h1>

      <Card padding="md" className="py-12 text-center">
        <p className="font-heading text-lg font-semibold text-ink">
          {t("comingSoon.title")}
        </p>

        <p className="mt-2 text-gray-500">{t("comingSoon.description")}</p>
      </Card>
    </main>
  );
}

export default ComingSoonPage;
