import { BrowserRouter, Routes, Route } from "react-router-dom";
import GeneratePage from './pages/GeneratePage'
import ResultPage from './pages/ResultPage'

// BrowserRouter: enable routing
// Routes: holds all route definitions
// Route: path="/" -> homepage, element={</>} -> component to show

function App() {
    return (
        <BrowserRouter> 
          <Routes>
            <Route path="/" element={<GeneratePage />} />
            <Route path="/result" element={<ResultPage />} />
          </Routes>
        </BrowserRouter>
    )
}
export default App