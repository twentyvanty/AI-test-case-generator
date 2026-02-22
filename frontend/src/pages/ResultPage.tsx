import React from "react";

interface ResultPageProps {
  data: any[];
  testType: string;
  onBack: () => void;
}

const ResultPage: React.FC<ResultPageProps> = ({ data, testType, onBack }) => {
  return (
    <div className="glass-card fade-in">

      <div
        style={{
        display: "flex",
        alignItems: "center",
        gap: "15px",
        marginBottom: "20px"
      }}
      >
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h2>{testType} Test Cases</h2>
      </div>

      <div className="results-container">

        {data.map((tc, index) => {

          const isNegative = [
            "invalid",
            "reject",
            "error",
            "fail",
            "not allowed",
            "denied"
          ].some(keyword =>
            tc.expected?.toLowerCase().includes(keyword)
          );

          return (
            <div key={index} className="test-case-card">

              <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                Test Case #{index + 1}
              </div>

              <h3>{tc.title}</h3>

              {/* Setup (TDD only) */}
              {tc.setup && (
                <div style={{ marginBottom: "15px" }}>
                  <strong>Setup:</strong>
                  <div className="technical-box">
                    <pre>{tc.setup}</pre>
                  </div>
                </div>
              )}

              {/* Steps */}
              <div style={{ marginBottom: "15px" }}>
                <strong>Steps:</strong>
                <ol style={{ paddingLeft: "20px", marginTop: "8px" }}>
                  {tc.steps?.map((step: string, i: number) => (
                    <li key={i} style={{ marginBottom: "6px" }}>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Assertion (TDD only) */}
              {tc.assertion && (
                <div style={{ marginBottom: "15px" }}>
                  <strong>Assertion:</strong>
                  <div className="technical-box">
                    <pre>{tc.assertion}</pre>
                  </div>
                </div>
              )}

              {/* Expected Result */}
              <div
                style={{
                  background: isNegative
                    ? "rgba(255, 0, 0, 0.15)"
                    : "rgba(0, 200, 100, 0.15)",
                  padding: "12px",
                  borderRadius: "10px",
                }}
              >
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