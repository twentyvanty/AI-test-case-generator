import {useState} from 'react';
import { Routes, Route } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import GeneratePage from './pages/GeneratePage'
import ResultPage from './pages/ResultPage'

// BrowserRouter: enable routing
// Routes: holds all route definitions
// Route: path="/" -> homepage, element={</>} -> component to show

function App() {

    const [requirement, setRequirement] = useState('')
    const [testType, setTestType] = useState('')
    const navigate = useNavigate();

    const handleGenerate = () => {
        navigate("/result");
    }

    return (
        <Routes>
            <Route
                path="/"
                element={
                    <GeneratePage
                       requirement={requirement}
                       setRequirement={setRequirement}
                       testType={testType}
                       setTestType={setTestType}
                       onGenerate={handleGenerate}
                    />
                }
            />
        
            <Route 
               path="/result"
               element={
                <ResultPage
                   requirement={requirement}
                   testType={testType}
                />
               }
            />
        </Routes>
    )
}

export default App