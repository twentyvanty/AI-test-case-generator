import prisma from "../prisma/client.js";
import { activeDefects } from "./defect.service.js";
import { ConflictError } from "./errors.js";
import { activeGeneration } from "./generation-lock.js";
import { buildReport, reportFingerprint } from "./report-builder.js";
import { findOwnedRequirement } from "./requirement.service.js";
import { activeScenarios } from "./scenario-rows.js";
import { activeTestCases } from "./test-case.service.js";

// The test completion report (Slice 6c, D-040). The live report is built from
// the requirement's data on every request (rules: report-builder.js); finalizing
// saves it, with the tester's conclusion, as a new version (TestReport).
// null = requirement (or version) not found, or not the user's.

const runFields = {
  id: true,
  kind: true,
  status: true,
  attempts: true,
  generatorModel: true,
  validatorModel: true,
  usage: true,
  validation: true,
  reviewedAt: true,
  createdAt: true,
  input: true,
};

// The AI runs behind the current scenarios and test cases, plus the test-data
// plan runs of the same clicks (their tokens count too)
async function runsBehind(requirementId, scenarios, testCases) {
  const runIds = [...new Set([...scenarios, ...testCases].map((item) => item.runId).filter((id) => id !== null))];

  if (runIds.length === 0) {
    return [];
  }

  const runs = await prisma.generationRun.findMany({
    where: { id: { in: runIds } },
    orderBy: { id: "asc" },
    select: runFields,
  });
  const generationIds = new Set(runs.map((run) => run.input?.generationId).filter(Boolean));
  const plans =
    generationIds.size > 0
      ? (
          await prisma.generationRun.findMany({
            where: { requirementId, kind: "TEST_DATA_PLAN" },
            orderBy: { id: "asc" },
            select: runFields,
          })
        ).filter((run) => generationIds.has(run.input?.generationId))
      : [];

  return [...runs, ...plans];
}

// The live report for a requirement row
async function liveReport(requirement) {
  const [project, scenarios, testCases, defects] = await Promise.all([
    prisma.project.findUnique({ where: { id: requirement.projectId }, include: { user: true } }),
    activeScenarios(prisma, requirement.id),
    activeTestCases(prisma, requirement.id),
    activeDefects(prisma, requirement.id),
  ]);

  return buildReport({
    requirement,
    projectName: project.name,
    tester: project.user.name ?? project.user.email ?? null,
    scenarios,
    testCases,
    defects,
    runs: await runsBehind(requirement.id, scenarios, testCases),
  });
}

const versionFields = {
  version: true,
  finalizedAt: true,
  verdict: true,
  withOpenRisks: true,
  conclusion: true,
  fingerprint: true,
};

// The live report plus: the draft conclusion, the latest finalized version, every
// version (newest first) and whether anything changed since the latest one
async function withFinalization(requirement, report) {
  const versions = await prisma.testReport.findMany({
    where: { requirementId: requirement.id },
    orderBy: { version: "desc" },
    select: versionFields,
  });
  const conclusion = requirement.reportConclusion ?? "";
  const [latest] = versions;
  const summaryOf = ({ fingerprint: _fingerprint, ...version }) => version;

  return {
    ...report,
    conclusion,
    finalized: latest ? summaryOf(latest) : null,
    versions: versions.map(({ version, finalizedAt, verdict }) => ({ version, finalizedAt, verdict })),
    changedSinceFinalized: latest
      ? latest.fingerprint !== reportFingerprint(report) || latest.conclusion !== conclusion
      : false,
  };
}

export async function getReport(keycloakUser, projectId, number) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, number);

  return requirement ? withFinalization(requirement, await liveReport(requirement)) : null;
}

// The tester's conclusion, saved while writing it (before finalizing)
export async function saveConclusion(keycloakUser, projectId, number, conclusion) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, number);

  if (!requirement) {
    return null;
  }

  const updated = await prisma.requirement.update({
    where: { id: requirement.id },
    data: { reportConclusion: conclusion },
  });

  return withFinalization(updated, await liveReport(updated));
}

export const NOT_READY_MESSAGE =
  "The suggested verdict is Not ready. Send acceptOpenRisks: true to finalize the report anyway.";

// Saves the live report with the conclusion as the next version and sets the
// requirement to REPORTED. Refused (409) with no test cases, while a generation
// runs, or when the verdict is Not ready and the tester didn't accept that.
// Returns the report as getReport does.
export async function finalizeReport(keycloakUser, projectId, number, { conclusion, acceptOpenRisks = false }) {
  const found = await findOwnedRequirement(keycloakUser, projectId, number);

  if (!found) {
    return null;
  }

  if (activeGeneration(found)) {
    throw new ConflictError("A generation is running for this requirement. Finalize the report once it has finished.");
  }

  const requirement =
    conclusion === undefined
      ? found
      : await prisma.requirement.update({ where: { id: found.id }, data: { reportConclusion: conclusion } });
  const report = await liveReport(requirement);

  if (report.summary.testCases.total === 0) {
    throw new ConflictError("Generate test cases before finalizing the report.");
  }

  if (report.summary.verdict.value === "NOT_READY" && acceptOpenRisks !== true) {
    throw new ConflictError(NOT_READY_MESSAGE);
  }

  const finalConclusion = requirement.reportConclusion ?? "";

  // The next version number; two finalizes at the same moment could pick the
  // same one, and the unique (requirementId, version) index rejects one: retry
  for (let attempt = 1; ; attempt++) {
    try {
      await prisma.$transaction(async (tx) => {
        const { _max } = await tx.testReport.aggregate({
          where: { requirementId: requirement.id },
          _max: { version: true },
        });

        await tx.testReport.create({
          data: {
            requirementId: requirement.id,
            version: (_max.version ?? 0) + 1,
            verdict: report.summary.verdict.value,
            withOpenRisks: report.risks.length > 0,
            conclusion: finalConclusion,
            snapshot: { ...report, conclusion: finalConclusion },
            fingerprint: reportFingerprint(report),
          },
        });

        await tx.requirement.update({ where: { id: requirement.id }, data: { status: "REPORTED" } });
      });
      break;
    } catch (error) {
      if (error.code !== "P2002" || attempt >= 3) {
        throw error;
      }
    }
  }

  return withFinalization({ ...requirement, status: "REPORTED" }, report);
}

// One finalized version, exactly as it was saved
export async function getReportVersion(keycloakUser, projectId, number, version) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, number);

  if (!requirement) {
    return null;
  }

  const saved = await prisma.testReport.findUnique({
    where: { requirementId_version: { requirementId: requirement.id, version } },
    select: { ...versionFields, fingerprint: false, snapshot: true },
  });

  return saved;
}
