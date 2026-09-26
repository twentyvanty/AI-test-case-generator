import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthContext";
import LanguageSwitcher from "../common/LanguageSwitcher";
import Button from "../ui/Button";

// Shared shell for every signed-in page: header on top, page content below.
function AppLayout() {
  const { t } = useTranslation();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <Link to="/" className="font-semibold text-gray-900">
          {t("app.name")}
        </Link>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          <Button variant="ghost" size="sm" onClick={logout}>
            {t("common.logout")}
          </Button>
        </div>
      </header>

      <Outlet />
    </div>
  );
}

export default AppLayout;
