
import LandingPage from './components/LandingPage';
import AccountPage from './components/AccountPage/AccountPage';
import NavBar from './components/NavBar/NavBar';
import EventPage from './components/EventPage';
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import './App.css';

function App() {
  return (
      <div className="App">
        <BrowserRouter>
         <NavBar/>
          <Routes>
            <Route path = '/' element = {<LandingPage />}/>
            <Route path = '/accountpage' element = {<AccountPage />}/>
            <Route path = '/FullEventInfo/:eventInfo' element = {<EventPage />}/>
          </Routes>
        </BrowserRouter>
      </div>
    );
  }

export default App;
