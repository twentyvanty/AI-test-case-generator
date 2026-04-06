import React from "react";

interface HomePageProps {
  onSelectTechnique: (technique: string) => void;
}

const techniques = [
  {
    id: "equivalence-partitioning",
    name: "Equivalence Partitioning",
    description: "Divides input data into valid and invalid partitions to reduce test cases while maintaining coverage.",
    howItWorks: "Identify equivalence classes (valid/invalid partitions) and test one representative value from each class.",
    outcome: "Comprehensive coverage with fewer test cases, efficient for large input ranges.",
    inputSuggestions: "Requirements with input validation, forms, APIs with parameters, user stories with acceptance criteria."
  },
  {
    id: "boundary-value-analysis",
    name: "Boundary Value Analysis",
    description: "Tests the boundaries between equivalence partitions, focusing on edge cases.",
    howItWorks: "Test values at the boundaries of input ranges (min, min+1, max-1, max) and their equivalents.",
    outcome: "Catches off-by-one errors and boundary-related bugs that equivalence partitioning might miss.",
    inputSuggestions: "Numeric inputs, ranges, limits, constraints in requirements or specifications."
  },
  {
    id: "decision-table",
    name: "Decision Table",
    description: "Maps all combinations of conditions to expected actions, ensuring no rule is missed.",
    howItWorks: "AI extracts conditions from your requirement. You confirm them, then a full rule matrix is generated.",
    outcome: "Complete coverage of all condition combinations, great for business logic with multiple rules.",
    inputSuggestions: "Features with multiple interacting rules, eligibility logic, pricing tiers, approval workflows."
  }
];

const HomePage: React.FC<HomePageProps> = ({ onSelectTechnique }) => {
  return (
    <div className="view-container fade-in">
      <h1 className="Title">AI Test Case Generator</h1>
      <p style={{ textAlign: "center", marginBottom: "30px", opacity: 0.8 }}>
        Choose a testing technique to get started
      </p>

      <div className="techniques-grid">
        {techniques.map((technique) => (
          <div key={technique.id} className="technique-card" onClick={() => onSelectTechnique(technique.id)}>
            <h3>{technique.name}</h3>
            <p className="technique-description">{technique.description}</p>

            <div className="technique-details">
              <div className="detail-section">
                <strong>How it works:</strong>
                <p>{technique.howItWorks}</p>
              </div>

              <div className="detail-section">
                <strong>Outcome:</strong>
                <p>{technique.outcome}</p>
              </div>

              <div className="detail-section">
                <strong>Suggested inputs:</strong>
                <p>{technique.inputSuggestions}</p>
              </div>
            </div>

            <button className="select-btn">Select Technique</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;