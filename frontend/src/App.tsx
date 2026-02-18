import { useState } from "react";
import GeneratePage from "./pages/GeneratePage";
import ResultPage from "./pages/ResultPage";
import LoadingSpinner from "./components/common/LoadingSpinner";
import { generateTestCases } from "./services/api";

function App() {
  const [step, setStep] = useState("input"); // input, loading, result
  const [testCases, setTestCases] = useState([]);
  const [config, setConfig] = useState({ requirement: "", testType: "TDD" });

  const handleGenerate = async (requirement: string, testType: string) => {
    try {
      setConfig({ requirement, testType });
      setStep("loading");
      const data = await generateTestCases(requirement, testType);
      setTestCases(data);
      setStep("result");
    } catch (err) {
      alert("Error: " + err);
      setStep("input");
    }
  };

  return (
    <div className="glass-card">
      {step === "input" && <GeneratePage onGenerate={handleGenerate} />}
      
      {step === "loading" && (
        <div className="loading-view fade-in">
          <LoadingSpinner />
          <p>Generating {config.testType} cases...</p>
        </div>
      )}

      {step === "result" && (
        <ResultPage 
          data={testCases} 
          testType={config.testType} 
          onBack={() => setStep("input")} 
        />
      )}
    </div>
  );
}

export default App;