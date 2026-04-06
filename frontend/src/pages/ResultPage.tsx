import React, { useState } from "react";

interface Condition {
  id: string;
  name: string;
  values: string[];
}

interface Rule {
  id?: string;
  title: string;
  conditionValues: Record<string, string>;
  expectedActions: string[];
  caseType: string;
}

interface DecisionTableData {
  conditions: Condition[];
  actions: string[];
  rules: Rule[];
}

interface ResultPageProps {
  data: any;
  testingProcess: any;
  technique: string;
  approach: string;
  onBack: () => void;
  onSelectApproach: (approach: string) => void;
}

// ─── Decision Table styles ───────────────────────────────────────────────────

const tableStyles = {
  wrapper: {
    overflowX: "auto" as const,
    marginTop: "24px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "14px",
    minWidth: "500px",
  },
  headerCell: {
    padding: "12px 16px",
    textAlign: "center" as const,
    fontWeight: 600,
    fontSize: "13px",
    opacity: 0.6,
    borderBottom: "2px solid rgba(255,255,255,0.15)",
    whiteSpace: "nowrap" as const,
  },
  sectionLabel: {
    padding: "6px 16px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    opacity: 0.45,
    background: "rgba(255,255,255,0.03)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  labelCell: {
    padding: "11px 16px",
    fontWeight: 500,
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    whiteSpace: "nowrap" as const,
    maxWidth: "200px",
  },
  valueCell: {
    padding: "11px 16px",
    textAlign: "center" as const,
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    fontSize: "13px",
    opacity: 0.8,
  },
  dividerRow: {
    borderTop: "2px solid rgba(255,255,255,0.18)",
  },
  yCell: {
    padding: "11px 16px",
    textAlign: "center" as const,
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    color: "#4caf50",
    fontWeight: 700,
    fontSize: "14px",
  },
  nCell: {
    padding: "11px 16px",
    textAlign: "center" as const,
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    color: "rgba(255,255,255,0.2)",
    fontSize: "14px",
  },
};

// ─── DecisionTableView component ────────────────────────────────────────────

const DecisionTableView: React.FC<{ data: DecisionTableData }> = ({ data }) => {
  const { conditions, actions, rules } = data;

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <span style={{
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          opacity: 0.5,
          marginRight: "12px",
        }}>
          {conditions.length} conditions
        </span>
        <span style={{
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          opacity: 0.5,
          marginRight: "12px",
        }}>
          {actions.length} actions
        </span>
        <span style={{
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          opacity: 0.5,
        }}>
          {rules.length} rules
        </span>
      </div>

      <div style={tableStyles.wrapper}>
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th style={{ ...tableStyles.headerCell, textAlign: "left" }}></th>
              {rules.map((_, i) => (
                <th key={i} style={tableStyles.headerCell}>TC {i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Section label: Conditions */}
            <tr>
              <td colSpan={rules.length + 1} style={tableStyles.sectionLabel}>
                Conditions
              </td>
            </tr>

            {conditions.map((cond) => (
              <tr key={cond.id}>
                <td style={tableStyles.labelCell}>{cond.name}</td>
                {rules.map((rule, i) => (
                  <td key={i} style={tableStyles.valueCell}>
                    {rule.conditionValues[cond.id] ?? rule.conditionValues[cond.name] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}

            {/* Section label: Actions */}
            <tr>
              <td
                colSpan={rules.length + 1}
                style={{ ...tableStyles.sectionLabel, ...tableStyles.dividerRow }}
              >
                Actions
              </td>
            </tr>

            {actions.map((action, ai) => (
              <tr key={ai}>
                <td style={tableStyles.labelCell}>{action}</td>
                {rules.map((rule, i) => {
                  const isActive = rule.expectedActions.includes(action);
                  return (
                    <td key={i} style={isActive ? tableStyles.yCell : tableStyles.nCell}>
                      {isActive ? "Y" : "N"}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Rule titles row */}
            <tr>
              <td style={{ ...tableStyles.sectionLabel, borderTop: "2px solid rgba(255,255,255,0.15)" }}>
                Rule
              </td>
              {rules.map((rule, i) => (
                <td
                  key={i}
                  style={{
                    ...tableStyles.valueCell,
                    fontSize: "11px",
                    opacity: 0.45,
                    borderTop: "2px solid rgba(255,255,255,0.15)",
                    padding: "8px 16px",
                  }}
                  title={rule.title}
                >
                  {rule.caseType}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Rule titles as cards below the table */}
      <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {rules.map((rule, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 16px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: "13px",
            }}
          >
            <span style={{ opacity: 0.45, minWidth: "40px", fontWeight: 600 }}>TC {i + 1}</span>
            <span style={{ flex: 1 }}>{rule.title}</span>
            <span style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              padding: "3px 8px",
              borderRadius: "4px",
              background: rule.caseType === "VALID"
                ? "rgba(76,175,80,0.15)"
                : rule.caseType === "INVALID"
                ? "rgba(244,67,54,0.15)"
                : "rgba(255,193,7,0.15)",
              color: rule.caseType === "VALID"
                ? "#4caf50"
                : rule.caseType === "INVALID"
                ? "#f44336"
                : "#ffc107",
            }}>
              {rule.caseType}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main ResultPage ─────────────────────────────────────────────────────────

const ResultPage: React.FC<ResultPageProps> = ({
  data,
  testingProcess,
  technique,
  approach,
  onBack,
  onSelectApproach,
}) => {
  const [selectedApproach, setSelectedApproach] = useState<string | null>(approach);

  const handleApproachSelect = async (approach: string) => {
    setSelectedApproach(approach);
    onSelectApproach(approach);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const isDecisionTable = technique === "decision-table";

  // For decision table, data is the full { conditions, actions, rules } object.
  // For EP/BVA, data is an array of test case objects.
  const flatTestCases: any[] = isDecisionTable
    ? (data?.rules ?? [])
    : Array.isArray(data) ? data : [];

  return (
    <div className="glass-card fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h2>Test Cases Generated</h2>
      </div>

      {/* ── TDD / BDD selection and output ── */}
      {!selectedApproach ? (
        <div className="approach-selection">
          <h3>Choose Testing Approach</h3>
          <p>Select how you want to implement these test cases:</p>
          <div className="approach-buttons">
            <button className="approach-btn" onClick={() => handleApproachSelect("TDD")}>
              <h4>TDD (Test-Driven Development)</h4>
              <p>Write tests first, then implement code. Red-Green-Refactor cycle.</p>
            </button>
            <button className="approach-btn" onClick={() => handleApproachSelect("BDD")}>
              <h4>BDD (Behavior-Driven Development)</h4>
              <p>Focus on business behavior with Given-When-Then scenarios.</p>
            </button>
          </div>
        </div>
      ) : testingProcess ? (
        <div className="testing-process">
          <h3>{selectedApproach} Implementation &amp; Scripts</h3>
          <div className="process-content">
            {testingProcess.testCases?.map((tc: any, index: number) => (
              <div key={index} className="process-card">
                <h4>Test Case #{index + 1}: {tc.title}</h4>

                {selectedApproach === "TDD" && (
                  <>
                    <div className="phase">
                      <strong>🔴 RED - Failing Test:</strong>
                      <div className="code-block">
                        <button className="copy-btn" onClick={() => copyToClipboard(tc.red)}>Copy</button>
                        <pre>{tc.red}</pre>
                      </div>
                    </div>
                    <div className="phase">
                      <strong>🟢 GREEN - Implementation:</strong>
                      <div className="code-block">
                        <button className="copy-btn" onClick={() => copyToClipboard(tc.green)}>Copy</button>
                        <pre>{tc.green}</pre>
                      </div>
                    </div>
                    <div className="phase">
                      <strong>🔵 REFACTOR - Production Code:</strong>
                      <div className="code-block">
                        <button className="copy-btn" onClick={() => copyToClipboard(tc.refactor)}>Copy</button>
                        <pre>{tc.refactor}</pre>
                      </div>
                    </div>
                  </>
                )}

                {selectedApproach === "BDD" && (
                  <>
                    <div className="phase">
                      <strong>Feature File:</strong>
                      <div className="code-block">
                        <button className="copy-btn" onClick={() => copyToClipboard(tc.feature)}>Copy</button>
                        <pre>{tc.feature}</pre>
                      </div>
                    </div>
                    <div className="phase">
                      <strong>Step Definitions:</strong>
                      <div className="code-block">
                        <button className="copy-btn" onClick={() => copyToClipboard(tc.steps)}>Copy</button>
                        <pre>{tc.steps}</pre>
                      </div>
                    </div>
                  </>
                )}

                {tc.script && (
                  <div className="phase">
                    <strong>Complete Script:</strong>
                    <div className="code-block">
                      <button className="copy-btn" onClick={() => copyToClipboard(tc.script)}>Copy</button>
                      <pre>{tc.script}</pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="loading-process">
          <p>Generating {selectedApproach} implementation...</p>
        </div>
      )}

      {/* ── Results section ── */}
      <div className="results-container">

        {/* Decision Table matrix view */}
        {isDecisionTable && data && (
          <DecisionTableView data={data as DecisionTableData} />
        )}

        {/* EP / BVA flat card list */}
        {!isDecisionTable && flatTestCases.map((tc, index) => {
          const isNegative = [
            "invalid", "reject", "error", "fail", "not allowed", "denied",
          ].some((keyword) => tc.expected?.toLowerCase().includes(keyword));

          return (
            <div key={index} className="test-case-card">
              <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                Test Case #{index + 1}
              </div>

              <h3>{tc.title}</h3>

              <div style={{ marginBottom: "15px" }}>
                <strong>Steps:</strong>
                <ol style={{ paddingLeft: "20px", marginTop: "8px" }}>
                  {tc.steps?.map((step: string, i: number) => (
                    <li key={i} style={{ marginBottom: "6px" }}>{step}</li>
                  ))}
                </ol>
              </div>

              <div style={{
                background: isNegative ? "rgba(255,0,0,0.15)" : "rgba(0,200,100,0.15)",
                padding: "12px",
                borderRadius: "10px",
              }}>
                <strong>Expected Result:</strong>
                <p style={{ marginTop: "6px" }}>
                  {tc.expected || "No expected result provided"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResultPage;