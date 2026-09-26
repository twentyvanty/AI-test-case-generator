import { useState } from "react";
import { Link } from "react-router-dom";
import Badge, { type BadgeTone } from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { cn } from "../utils/cn";

type TestCase = {
  id: string;
  title: string;
  status: "Passed" | "Failed" | "Not Tested";
};

const testCases: TestCase[] = [
  {
    id: "TC-001",
    title: "Login with valid username and password",
    status: "Passed",
  },
  {
    id: "TC-002",
    title: "Login with an incorrect password",
    status: "Failed",
  },
  {
    id: "TC-003",
    title: "Login with an empty password",
    status: "Not Tested",
  },
];

type Tab = "overview" | "requirements" | "testCases" | "generate";

const statusTones: Record<TestCase["status"], BadgeTone> = {
  Passed: "success",
  Failed: "danger",
  "Not Tested": "neutral",
};

// TODO: load the real project with useParams().projectId once the
// project detail API exists. Everything below is still mock data.
function ProjectPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <main className="mx-auto max-w-7xl px-8 py-8">

      {/* Back */}
      <Link
        to="/"
        className="mb-6 inline-block text-sm font-medium text-gray-500 hover:text-gray-900"
      >
        ← Back to Projects
      </Link>

      {/* Project Header */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400">
              Project
            </p>

            <h1 className="mt-1 text-3xl font-semibold text-gray-900">
              E-Commerce Website
            </h1>

            <p className="mt-2 text-gray-500">
              Test case generation for the online shopping system.
            </p>
          </div>

          <Badge tone="info" className="text-sm">
            In Progress
          </Badge>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b border-gray-200">

        <TabButton
          label="Overview"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        />

        <TabButton
          label="Requirements"
          active={activeTab === "requirements"}
          onClick={() => setActiveTab("requirements")}
        />

        <TabButton
          label="Test Cases"
          active={activeTab === "testCases"}
          onClick={() => setActiveTab("testCases")}
        />

        <TabButton
          label="Generate"
          active={activeTab === "generate"}
          onClick={() => setActiveTab("generate")}
        />

      </div>

      {/* Tab Content */}
      <div className="mt-8">

        {activeTab === "overview" && (
          <OverviewTab testCases={testCases} />
        )}

        {activeTab === "requirements" && (
          <RequirementsTab />
        )}

        {activeTab === "testCases" && (
          <TestCasesTab testCases={testCases} />
        )}

        {activeTab === "generate" && (
          <GenerateTab />
        )}

      </div>

    </main>
  );
}

type TabButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function TabButton({
  label,
  active,
  onClick,
}: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "border-b-2 px-4 py-3 text-sm font-medium transition",
        active
          ? "border-gray-900 text-gray-900"
          : "border-transparent text-gray-500 hover:text-gray-900"
      )}
    >
      {label}
    </button>
  );
}

function OverviewTab({ testCases }: { testCases: TestCase[] }) {
  const total = testCases.length;

  const completed = testCases.filter(
    (testCase) => testCase.status === "Passed"
  ).length;

  const failed = testCases.filter(
    (testCase) => testCase.status === "Failed"
  ).length;

  const notTested = testCases.filter(
    (testCase) => testCase.status === "Not Tested"
  ).length;

  return (
    <div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Project Overview
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          A summary of your current testing progress.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-4">

        <StatCard
          label="Requirements"
          value="3"
        />

        <StatCard
          label="Total Test Cases"
          value={String(total)}
        />

        <StatCard
          label="Passed"
          value={String(completed)}
        />

        <StatCard
          label="Need Review"
          value={String(failed + notTested)}
        />

      </div>

    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card padding="md">
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-semibold text-gray-900">
        {value}
      </p>
    </Card>
  );
}

function RequirementsTab() {
  return (
    <div>

      <div className="mb-6 flex items-center justify-between">

        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Requirements
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage the requirements used to generate test cases.
          </p>
        </div>

        <Button>
          + Add Requirement
        </Button>

      </div>

      <div className="space-y-4">

        <Card>

          <div className="flex items-start justify-between">

            <div>
              <span className="font-mono text-xs text-gray-400">
                REQ-001
              </span>

              <h3 className="mt-2 text-lg font-medium text-gray-900">
                User Login
              </h3>
            </div>

            <Badge tone="success">
              Ready
            </Badge>

          </div>

          <p className="mt-4 text-sm leading-6 text-gray-500">
            Users should be able to log in using a valid email
            address and password.
          </p>

        </Card>

        <Card>

          <div className="flex items-start justify-between">

            <div>
              <span className="font-mono text-xs text-gray-400">
                REQ-002
              </span>

              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Product Search
              </h3>
            </div>

            <Badge tone="success">
              Ready
            </Badge>

          </div>

          <p className="mt-4 text-sm leading-6 text-gray-500">
            Users should be able to search for products using
            keywords and view matching results.
          </p>

        </Card>

      </div>

    </div>
  );
}

function TestCasesTab({
  testCases,
}: {
  testCases: TestCase[];
}) {
  return (
    <div>

      <div className="mb-6 flex items-center justify-between">

        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Test Cases
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Review and update your generated test cases.
          </p>
        </div>

        <Button>
          + Generate Test Cases
        </Button>

      </div>

      <Card padding="none" className="overflow-hidden">

        {testCases.map((testCase) => (
          <div
            key={testCase.id}
            className="flex items-center justify-between border-b border-gray-100 px-6 py-5 last:border-b-0"
          >

            <div className="flex items-center gap-4">

              <span className="font-mono text-sm text-gray-400">
                {testCase.id}
              </span>

              <span className="text-sm font-medium text-gray-800">
                {testCase.title}
              </span>

            </div>

            <Badge tone={statusTones[testCase.status]}>
              {testCase.status}
            </Badge>

          </div>
        ))}

      </Card>

    </div>
  );
}

function GenerateTab() {
  return (
    <div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Generate Test Cases
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Generate test cases from your project requirements.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">

        <h3 className="text-lg font-medium text-gray-900">
          Test Case Generation
        </h3>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500">
          Select a requirement and testing technique to
          generate test cases using AI.
        </p>

        <Button size="lg" className="mt-6">
          Start Generation
        </Button>

      </div>

    </div>
  );
}

export default ProjectPage;