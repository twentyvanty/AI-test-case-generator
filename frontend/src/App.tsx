import { useState } from "react";
import { generateTestCases } from "./services/api";

function App() {
  const [requirement, setRequirement] = useState("");
  const [testType, setTestType] = useState("BDD");
  const [testCases, setTestCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div>
      <h1>AI Test Case Generator</h1>

      <textarea
        value={requirement}
        onChange={(e) => setRequirement(e.target.value)}
        placeholder="Enter requirement..."
      />

      <select
        value={testType}
        onChange={(e) => setTestType(e.target.value)}
      >
        <option value="BDD">BDD</option>
        <option value="TDD">TDD</option>
      </select>

      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div>
        {testCases.map((tc, index) => (
          <div key={index}>
            <h3>{tc.title}</h3>
            <ul>
              {tc.steps.map((step: string, i: number) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
            <p><strong>Expected:</strong> {tc.expected}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
