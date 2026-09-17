import { useAuth } from "../auth/AuthProvider";

type Project = {
  id: number;
  name: string;
  description: string;
  status: "Not Started" | "In Progress" | "Completed";
  totalTestCases: number;
  completedTestCases: number;
  lastUpdated: string;
};

type DashboardPageProps = {
  onOpenProject: (projectId: number) => void;
};

const projects: Project[] = [
  {
    id: 1,
    name: "E-Commerce Website",
    description: "Test case generation for the online shopping system.",
    status: "In Progress",
    totalTestCases: 24,
    completedTestCases: 18,
    lastUpdated: "Today",
  },
  {
    id: 2,
    name: "Hotel Booking System",
    description: "Test cases for hotel search and booking functionality.",
    status: "Not Started",
    totalTestCases: 0,
    completedTestCases: 0,
    lastUpdated: "2 days ago",
  },
];

function DashboardPage({ onOpenProject }: DashboardPageProps) {
  const { username } = useAuth();

  const handleNewProject = () => {
    console.log("Create new project");
  };

  return (
    <main className="mx-auto max-w-7xl px-8 py-8">

      {/* Welcome Section */}
      <section className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Welcome back, {username}
          </h1>

          <p className="mt-2 text-gray-500">
            Continue working on your test case projects.
          </p>
        </div>

        <button
          onClick={handleNewProject}
          className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700"
        >
          + New Project
        </button>
      </section>

      {/* Projects Section */}
      <section>

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Your Projects
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage your test case generation projects.
            </p>
          </div>

          <span className="text-sm text-gray-400">
            {projects.length} projects
          </span>
        </div>

        {/* Project Cards */}
        <div className="grid gap-5 md:grid-cols-2">

          {projects.map((project) => {

            const progress =
              project.totalTestCases === 0
                ? 0
                : Math.round(
                    (project.completedTestCases /
                      project.totalTestCases) *
                      100
                  );

            const remaining =
              project.totalTestCases -
              project.completedTestCases;

            return (
              <div
                key={project.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >

                {/* Project Header */}
                <div className="flex items-start justify-between">

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {project.name}
                    </h3>

                    <span
                      className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        project.status === "In Progress"
                          ? "bg-blue-50 text-blue-600"
                          : project.status === "Completed"
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                </div>

                {/* Description */}
                <p className="mt-4 text-sm leading-6 text-gray-500">
                  {project.description}
                </p>

                {/* Progress */}
                <div className="mt-6">

                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-gray-500">
                      Test Case Progress
                    </span>

                    <span className="font-medium text-gray-700">
                      {progress}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                </div>

                {/* Statistics */}
                <div className="mt-6 grid grid-cols-3 divide-x rounded-xl bg-gray-50 py-4">

                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">
                      {project.totalTestCases}
                    </p>

                    <p className="text-xs text-gray-400">
                      Total
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">
                      {project.completedTestCases}
                    </p>

                    <p className="text-xs text-gray-400">
                      Completed
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">
                      {remaining}
                    </p>

                    <p className="text-xs text-gray-400">
                      Remaining
                    </p>
                  </div>

                </div>

                {/* Footer */}
                <div className="mt-6 flex items-center justify-between">

                  <span className="text-xs text-gray-400">
                    Updated {project.lastUpdated}
                  </span>

                  <button
                    onClick={() => onOpenProject(project.id)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Open Project →
                  </button>

                </div>

              </div>
            );
          })}

        </div>

      </section>

    </main>
  );
}

export default DashboardPage;