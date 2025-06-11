import LandingPage from './components/LandingPage';
import EventPage from './components/EventPage';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import Login from './components/Login'
import FullEventInfo from './components/FullEventInfo';
import UserProfile from './components/UserProfile';
import AccountPage from './components/AccountPage/AccountPage';
import './App.css';

function App() {
  return (
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path = '/' element = {<LandingPage />}/>
            <Route path="/FullEventInfo/:eventTitle" element={<FullEventInfo />} />
            <Route path = '/FullEventInfo/:eventInfo' element = {<EventPage />}/>
            <Route path="/account" element={<AccountPage />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
            <Route path='/login' element={<Login />} />
          </Routes>
        </BrowserRouter>
      </div>
    );
  }

export default App;