import { useState } from "react";
import HomePage from "./pages/HomePage";
import GeneratePage from "./pages/GeneratePage";
import ResultPage from "./pages/ResultPage";
import LoadingSpinner from "./components/common/LoadingSpinner";
import { generateTestCases, generateTestingProcess } from "./services/api";

function App() {
  const [step, setStep] = useState("home"); // home, input, loading, result
  const [testCases, setTestCases] = useState([]);
  const [testingProcess, setTestingProcess] = useState(null);
  const [config, setConfig] = useState({ requirement: "", technique: "", approach: "" });

  const handleSelectTechnique = (technique: string) => {
    setConfig(prev => ({ ...prev, technique }));
    setStep("input");
  };

  const handleGenerate = async (requirement: string) => {
    try {
      setConfig(prev => ({ ...prev, requirement }));
      setStep("loading");
      const data = await generateTestCases(requirement, config.technique);
      setTestCases(data);
      setStep("result");
    } catch (err) {
      alert("Error: " + err);
      setStep("input");
    }
  };

  const handleSelectApproach = async (approach: string) => {
    try {
      setConfig(prev => ({ ...prev, approach }));
      setStep("loading");
      const data = await generateTestingProcess(testCases, approach);
      setTestingProcess(data);
      setStep("result");
    } catch (err) {
      alert("Error: " + err);
      setStep("result"); // Stay on result page
    }
  };

  return (
    <div className="glass-card">
      {step === "home" && <HomePage onSelectTechnique={handleSelectTechnique} />}
      
      {step === "input" && <GeneratePage onGenerate={handleGenerate} onBack={() => setStep("home")} />}
      
      {step === "loading" && (
        <div className="loading-view fade-in">
          <LoadingSpinner />
        </div>
      )}

      {step === "result" && (
        <ResultPage 
          data={testCases} 
          testingProcess={testingProcess}
          technique={config.technique}
          approach={config.approach}
          onBack={() => setStep("input")} 
          onSelectApproach={handleSelectApproach}
        />
      )}
    </div>
  );
}

export default App;