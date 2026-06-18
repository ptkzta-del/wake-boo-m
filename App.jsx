import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AlarmClock from '@/pages/AlarmClock';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AlarmClock />} />
      </Routes>
    </Router>
  )
}

export default App