import { useTranslation } from "react-i18next";
import { changeLanguage, SUPPORTED_LANGUAGES } from "../../i18n";
import { cn } from "../../utils/cn";

// EN / TH segmented toggle
function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t("common.language")}
      className="flex rounded-full border border-white/80 bg-white/70 p-0.5"
    >
      {SUPPORTED_LANGUAGES.map((language) => {
        const active = i18n.language === language;

        return (
          <button
            key={language}
            type="button"
            aria-pressed={active}
            onClick={() => changeLanguage(language)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition",
              active ? "bg-ink text-white" : "text-gray-500 hover:text-ink"
            )}
          >
            {language}
          </button>
        );
      })}
    </div>
  );
}

export default LanguageSwitcher;
