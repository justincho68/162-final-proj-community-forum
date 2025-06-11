
import LandingPage from './components/LandingPage';
import EditAccountPage from './components/EditAccountPage/EditAccountPage';
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
            <Route path = '/editaccountpage' element = {<EditAccountPage />}/>
            <Route path = '/FullEventInfo/:eventInfo' element = {<EventPage />}/>
          </Routes>
        </BrowserRouter>
      </div>
    );
  }

export default App;
