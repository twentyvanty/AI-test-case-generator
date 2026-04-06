import React, { useState } from "react";

interface Condition {
  id: string;
  name: string;
  values: string[];
}

interface ConditionReviewPageProps {
  conditions: Condition[];
  actions: string[];
  onConfirm: (conditions: Condition[], actions: string[]) => void;
  onBack: () => void;
}

const ConditionReviewPage: React.FC<ConditionReviewPageProps> = ({
  conditions: initial,
  actions: initialActions,
  onConfirm,
  onBack,
}) => {
  const [conditions, setConditions] = useState<Condition[]>(initial);
  const [actions, setActions] = useState<string[]>(initialActions);

  const updateConditionName = (id: string, name: string) => {
    setConditions(c => c.map(cond => cond.id === id ? { ...cond, name } : cond));
  };

  const updateValue = (condId: string, idx: number, val: string) => {
    setConditions(c => c.map(cond =>
      cond.id === condId
        ? { ...cond, values: cond.values.map((v, i) => i === idx ? val : v) }
        : cond
    ));
  };

  const addValue = (condId: string) => {
    setConditions(c => c.map(cond =>
      cond.id === condId ? { ...cond, values: [...cond.values, ""] } : cond
    ));
  };

  const removeValue = (condId: string, idx: number) => {
    setConditions(c => c.map(cond =>
      cond.id === condId
        ? { ...cond, values: cond.values.filter((_, i) => i !== idx) }
        : cond
    ));
  };

  const removeCondition = (id: string) => {
    setConditions(c => c.filter(cond => cond.id !== id));
  };

  const addCondition = () => {
    const id = `c${Date.now()}`;
    setConditions(c => [...c, { id, name: "", values: ["", ""] }]);
  };

  const updateAction = (idx: number, val: string) => {
    setActions(a => a.map((action, i) => i === idx ? val : action));
  };

  const removeAction = (idx: number) => {
    setActions(a => a.filter((_, i) => i !== idx));
  };

  const addAction = () => {
    setActions(a => [...a, ""]);
  };

  return (
    <div className="view-container fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1 className="Title">Review Extracted Conditions</h1>
      </div>

      <p style={{ opacity: 0.7, marginBottom: "24px" }}>
        AI extracted these conditions from your requirement. Edit, add, or remove before generating the table.
      </p>

      <h3>Conditions</h3>
      {conditions.map((cond) => (
        <div key={cond.id} className="technique-card" style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
            <input
              value={cond.name}
              onChange={e => updateConditionName(cond.id, e.target.value)}
              placeholder="Condition name"
              style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "inherit" }}
            />
            <button onClick={() => removeCondition(cond.id)} style={{ opacity: 0.5 }}>✕</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {cond.values.map((val, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <input
                  value={val}
                  onChange={e => updateValue(cond.id, idx, e.target.value)}
                  placeholder="Value"
                  style={{ width: "120px", padding: "6px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "inherit" }}
                />
                <button onClick={() => removeValue(cond.id, idx)} style={{ opacity: 0.4, fontSize: "12px" }}>✕</button>
              </div>
            ))}
            <button onClick={() => addValue(cond.id)} className="select-btn" style={{ padding: "6px 12px", fontSize: "13px" }}>
              + Value
            </button>
          </div>
        </div>
      ))}
      <button onClick={addCondition} className="select-btn" style={{ marginBottom: "28px" }}>
        + Add Condition
      </button>

      <h3>Expected Actions</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
        {actions.map((action, idx) => (
          <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              value={action}
              onChange={e => updateAction(idx, e.target.value)}
              placeholder="Action / outcome"
              style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "inherit" }}
            />
            <button onClick={() => removeAction(idx)} style={{ opacity: 0.5 }}>✕</button>
          </div>
        ))}
        <button onClick={addAction} className="select-btn" style={{ alignSelf: "flex-start" }}>
          + Add Action
        </button>
      </div>

      <div className="action-bar">
        <button
          className="generate-btn"
          onClick={() => onConfirm(conditions, actions)}
        >
          Generate Decision Table
        </button>
      </div>
    </div>
  );
};

export default ConditionReviewPage;