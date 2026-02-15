import { useState } from "react";
import { generateTestCases } from "./services/api";

function App() {
  const [requirement, setRequirement] = useState("");
  const [testType, setTestType] = useState("BDD");
  const [testCases, setTestCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false); // ควบคุมการเปิด/ปิด Dropdown

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await generateTestCases(requirement, testType);
      setTestCases(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card">
      <h1>AI Test Case Generator</h1>

      <textarea 
        className="requirement-input" // เปลี่ยนชื่อ class ให้ชัดเจน
        value={requirement}
        onChange={(e) => setRequirement(e.target.value)}
        placeholder="Enter requirement..."
      />

      <div className="action-bar">
        {/* --- Custom Dropdown Start --- */}
        <div className="custom-dropdown">
          <div className="dropdown-header" onClick={() => setIsOpen(!isOpen)}>
            <span>{testType}</span>
            <span className={`arrow ${isOpen ? 'open' : ''}`}>▼</span>
          </div>
          
          {isOpen && (
            <div className="dropdown-list">
              <div className="option" onClick={() => { setTestType("BDD"); setIsOpen(false); }}>BDD</div>
              <div className="option" onClick={() => { setTestType("TDD"); setIsOpen(false); }}>TDD</div>
            </div>
          )}
        </div>
        {/* --- Custom Dropdown End --- */}

        <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      <div className="results-container">
        {testCases.map((tc, index) => (
          <div key={index} className="test-case-card">
            <h3>{tc.title}</h3>
            <ul>
              {tc.steps.map((step: string, i: number) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
            <p className="expected-text"><strong>Expected:</strong> {tc.expected}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;