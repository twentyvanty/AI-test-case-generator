import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";

export type ActionMenuItem = {
  label: string;
  onSelect: () => void;
  danger?: boolean;
};

type ActionMenuProps = {
  // Screen-reader name of the ⋯ button, e.g. "Actions for TC-0004"
  label: string;
  items: ActionMenuItem[];
  disabled?: boolean;
};

// A "⋯" button with a small menu. The menu is drawn in <body> with fixed
// positioning, so a scrolling table around the button can't cut it off; when the
// page scrolls, the menu moves with its button.
function ActionMenu({ label, items, disabled = false }: ActionMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);

  const close = () => setPosition(null);
  const isOpen = position !== null;

  const placeUnderButton = () => {
    const rect = buttonRef.current?.getBoundingClientRect();

    if (rect) {
      setPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
  };

  const toggle = () => {
    if (position) {
      close();
    } else {
      placeUnderButton();
    }
  };

  // Close on a click outside, Escape or resizing; follow the button when scrolling
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        close();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", placeUnderButton, true);
    window.addEventListener("resize", close);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", placeUnderButton, true);
      window.removeEventListener("resize", close);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={toggle}
        className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-ink disabled:opacity-40"
      >
        <span aria-hidden="true">⋯</span>
      </button>

      {position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: position.top, right: position.right }}
            className="fixed z-50 min-w-32 rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  item.onSelect();
                }}
                className={cn(
                  "block w-full rounded-lg px-3 py-1.5 text-left text-sm transition hover:bg-gray-100",
                  item.danger ? "text-danger" : "text-ink"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

export default ActionMenu;
