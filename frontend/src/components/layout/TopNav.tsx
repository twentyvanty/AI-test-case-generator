import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../common/LanguageSwitcher";
import { cn } from "../../utils/cn";
import { navItems } from "./navItems";
import UserMenu from "./UserMenu";

function TopNav() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 border-b border-white/80 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-10 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="font-heading text-base font-semibold tracking-tight text-ink"
        >
          {t("app.name")}
        </Link>

        {/* Full-width second row on small screens, inline on desktop */}
        <nav
          aria-label={t("nav.main")}
          className="order-last -mx-1 flex w-full gap-6 overflow-x-auto px-1 md:order-none md:w-auto md:gap-7"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "whitespace-nowrap py-1 text-sm transition",
                  isActive
                    ? "font-medium text-ink"
                    : "text-gray-500 hover:text-ink"
                )
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <LanguageSwitcher />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

export default TopNav;
