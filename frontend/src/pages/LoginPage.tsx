import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <Card className="p-8 text-center" padding="none">
        <h1 className="text-2xl font-semibold text-gray-900">
          {t("login.title")}
        </h1>

        <p className="mt-2 text-gray-500">{t("login.description")}</p>

        <Button size="lg" className="mt-6" onClick={login}>
          {t("common.login")}
        </Button>
      </Card>
    </div>
  );
}

export default LoginPage;
