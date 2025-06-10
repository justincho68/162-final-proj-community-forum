
import LandingPage from './components/LandingPage';
import AccountPage from './components/AccountPage/AccountPage';
import NavBar from './components/NavBar/NavBar';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <Router>
      <NavBar/>
      <Routes>
        <Route exact path="/" element={<LandingPage />} />
        <Route path="/AccountPage" element={<AccountPage />} />
      </Routes>
    </Router>
    );
  }

export default App;
