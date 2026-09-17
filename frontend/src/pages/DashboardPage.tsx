import { useAuth } from "../auth/AuthProvider";
import { useEffect, useState } from "react";
import { getProjects, createProject, type Project } from "../services/api";
import { useTranslation } from "react-i18next";

type DashboardPageProps = {
  onOpenProject: (projectId: number) => void;
};

function DashboardPage({ onOpenProject }: DashboardPageProps) {
  const { username } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        console.error("Failed to load projects:", error);
        setError("Failed to load projects.");
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  const handleNewProject = () => {
    setShowCreateModal(true);
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      return;
    }

    try {
      setCreating(true);

      const newProject = await createProject(
        projectName.trim(),
        projectDescription.trim()
      );

      setProjects((currentProjects) => [
        newProject,
        ...currentProjects,
      ]);

      setProjectName("");
      setProjectDescription("");
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-8 py-8">
        <p className="text-gray-500">{t("common.loading")}</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-8 py-8">
        <p className="text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-8 py-8">

      {/* Welcome Section */}
      <section className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            {t("dashboard.welcome", { username })}
          </h1>

          <p className="mt-2 text-gray-500">
            {t("dashboard.subtitle")}
          </p>
        </div>

        <button
          onClick={handleNewProject}
          className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700"
        >
          {t("dashboard.newProject")}
        </button>
      </section>

      {/* Projects Section */}
      <section>

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t("dashboard.yourProjects")}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {t("dashboard.projectsDescription")}
            </p>
          </div>

          <span className="text-sm text-gray-400">
            {t("dashboard.projectCount", { count: projects.length })}
          </span>
        </div>

        {/* Project Cards */}
        <div className="grid gap-5 md:grid-cols-2">

          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-gray-900">
                {project.name}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                {project.description || t("dashboard.noDescription")}
              </p>

              <button
                onClick={() => onOpenProject(project.id)}
                className="mt-4 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white"
              >
                {t("common.open")}
              </button>
            </div>
          ))}

        </div>

      </section>

      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">
              {t("project.createTitle")}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {t("project.createDescription")}
            </p>

            <div className="mt-6">
              <label className="text-sm font-medium text-gray-700">
                {t("project.projectName")}
              </label>

              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder={t("project.projectNamePlaceholder")}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
              />
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700">
                {t("project.description")}
              </label>

              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder={t("project.descriptionPlaceholder")}
                rows={4}
                className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                {t("common.cancel")}
              </button>

              <button
                onClick={handleCreateProject}
                disabled={creating || !projectName.trim()}
                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? t("project.creating") : t("project.createProject")}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

export default DashboardPage;