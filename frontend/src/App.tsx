import { useState } from "react";
import { useAuth } from "./auth/AuthProvider";
import DashboardPage from "./pages/DashboardPage";
import ProjectPage from "./pages/ProjectPage";
import keycloak from "./auth/keycloak";

function App() {
  const {
    isAuthenticated,
    login,
    logout,
  } = useAuth();

  const [currentPage, setCurrentPage] = useState<"dashboard" | "project">(
    "dashboard"
  );

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">
            AI Test Case Generator
          </h1>

          <p className="mt-2 text-gray-500">
            Please log in to continue.
          </p>

          <button
            onClick={login}
            className="mt-6 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  console.log("ACCESS TOKEN:", keycloak.token);

  const handleOpenProject = (projectId: number) => {
    setSelectedProjectId(projectId);
    setCurrentPage("project");
  };

  const handleBackToDashboard = () => {
    setSelectedProjectId(null);
    setCurrentPage("dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-100">

      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <span className="font-semibold text-gray-900">
          AI Test Case Generator
        </span>

        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Logout
        </button>
      </header>

      {currentPage === "dashboard" && (
        <DashboardPage
          onOpenProject={handleOpenProject}
        />
      )}

      {currentPage === "project" && selectedProjectId !== null && (
        <ProjectPage
          projectId={selectedProjectId}
          onBack={handleBackToDashboard}
        />
      )}

    </div>
  );
}

export default App;