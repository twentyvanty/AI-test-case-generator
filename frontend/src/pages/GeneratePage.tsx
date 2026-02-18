import React, { useState } from "react"; // แก้ไข: เพิ่มการ import useState

interface GeneratePageProps {
  onGenerate: (requirement: string, testType: string) => void;
}

const GeneratePage: React.FC<GeneratePageProps> = ({ onGenerate }) => {
  const [requirement, setRequirement] = useState("");
  const [testType, setTestType] = useState("TDD");

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRequirement(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="view-container fade-in">
      <h1>AI Test Case Generator</h1>
      <textarea 
        className="requirement-input"
        value={requirement}
        onChange={handleInput}
        placeholder="Describe your requirement..."
      />
      <div className="action-bar">
        <select 
          className="custom-select" 
          value={testType} 
          onChange={(e) => setTestType(e.target.value)}
        >
          <option value="TDD">TDD</option>
          <option value="BDD">BDD</option>
        </select>
        <button 
          className="generate-btn" 
          onClick={() => onGenerate(requirement, testType)}
          disabled={!requirement.trim()}
        >
          Generate
        </button>
      </div>
    </div>
  );
};

export default GeneratePage; // แก้ไข: ต้องมีบรรทัดนี้เพื่อให้ไฟล์อื่น import ไปใช้ได้