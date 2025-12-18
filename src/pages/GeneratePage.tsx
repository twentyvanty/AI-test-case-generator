import { useState } from 'react';

function App() {

  const [requirement, setRequirement] = useState('');
  // req: input, set: updated input function, '': defualt value

  const [testType, setTestType] = useState('');

  const canGenerate = requirement.trim() !== '' && testType !== '';
  //trim(): removes spaces 

  return (
    <>
    <div className="app">
      <h1 id="title">Test Case Generator</h1>

      <div className="field">
        <label> Please enter your requirement first. </label>
        <textarea className="box"
          value={requirement} //display state value 
          onChange={(e) => setRequirement(e.target.value)}
        //onchange: everytime user type sth do...
        //e.target.value: latest value */}
        //setreq(..): store text in state */}
        />
      </div>
      
      <div className="field">
        <label>Test Type</label> 
        <select value={testType} onChange={(e) => setTestType(e.target.value)}>
          <option value=""> Select test type </option>
          <option value="BDD">BDD</option>
          <option value="TDD">TDD</option>
        </select>
      </div>

      <div>
        <button disabled={!canGenerate} className="Generatebtn"> 
          Generate Test Case
        </button>
      </div>
      </div>
    </>
  )
}



export default App
