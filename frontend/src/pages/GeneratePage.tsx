import React, { useState } from "react"; // แก้ไข: เพิ่มการ import useState

interface GeneratePageProps {
  onGenerate: (requirement: string, testType: string) => void;
}

const GeneratePage: React.FC<GeneratePageProps> = ({ onGenerate }) => {
  const [requirement, setRequirement] = useState("");
  const [testType, setTestType] = useState("TDD");
  const [isOpen, setIsOpen] = useState(false);

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
        {/* Custom Glass Dropdown */}
        <div className="custom-dropdown">
          <div className="dropdown-header" onClick={() => setIsOpen(!isOpen)}>
            <span>{testType}</span>
            <span className={`arrow ${isOpen ? 'open' : ''}`}>▼</span>
          </div>

          {isOpen && (
            <div className="dropdown-list fade-in">
              <div className="option" onClick={() => { setTestType("BDD"); setIsOpen(false); }}>BDD</div>
              <div className="option" onClick={() => { setTestType("TDD"); setIsOpen(false); }}>TDD</div>
            </div>
          )}
        </div>

        <button className="generate-btn" onClick={() => onGenerate(requirement, testType)}>
          Generate
        </button>
      </div>
    </div>
  );
};

export default GeneratePage; // แก้ไข: ต้องมีบรรทัดนี้เพื่อให้ไฟล์อื่น import ไปใช้ได้