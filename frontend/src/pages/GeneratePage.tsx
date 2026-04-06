import React, { useState } from "react";

interface GeneratePageProps {
  onGenerate: (requirement: string) => void;
  onBack: () => void;
}

const GeneratePage: React.FC<GeneratePageProps> = ({ onGenerate, onBack }) => {
  const [requirement, setRequirement] = useState("");

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRequirement(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="view-container fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h1 className="Title">Enter Your Requirement</h1>
      </div>
      
      <textarea
        className="requirement-input"
        value={requirement}
        onChange={handleInput}
        placeholder="Describe your requirement, user story, SRS, or any input..."
      />

      <div className="action-bar">
        <button className="generate-btn" onClick={() => onGenerate(requirement)}>
          Generate Test Cases
        </button>
      </div>
    </div>
  );
};

export default GeneratePage;