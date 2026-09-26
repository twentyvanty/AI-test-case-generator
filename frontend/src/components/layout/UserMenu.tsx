import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../auth/AuthContext";

// "Jane Doe" → "JD", "jane" → "JA"
function getInitials(name?: string) {
  if (!name) {
    return "?";
  }

  const words = name.trim().split(/\s+/);

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

function UserMenu() {
  const { t } = useTranslation();
  const { displayName, email, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={t("userMenu.open")}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-white/70 text-xs font-semibold text-ink transition hover:bg-white"
      >
        {getInitials(displayName)}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-white/80 bg-white/95 p-2 shadow-lg backdrop-blur-md">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-ink">
              {displayName}
            </p>

            {email && (
              <p className="truncate text-xs text-gray-500">{email}</p>
            )}
          </div>

          <div className="my-1 border-t border-gray-100" />

          <Link
            to="/account"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            {t("nav.account")}
          </Link>

          <button
            type="button"
            onClick={logout}
            className="block w-full rounded-xl px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
          >
            {t("common.logout")}
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
