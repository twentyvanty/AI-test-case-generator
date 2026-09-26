import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";

// Shared shell for every signed-in page:
// sticky top nav, then sidebar (desktop only) + page content.
function AppLayout() {
  return (
    <div className="min-h-screen">
      <TopNav />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-8">
        <aside className="hidden self-start lg:block">
          <Sidebar />
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AppLayout;
