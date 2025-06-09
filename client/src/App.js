
import LandingPage from './components/LandingPage';
import EventPage from './components/EventPage';
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import './App.css';

function App() {
  return (
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path = '/' element = {<LandingPage />}/>
            <Route path = '/FullEventInfo/:eventInfo' element = {<EventPage />}/>
          </Routes>
        </BrowserRouter>
      </div>
    );
  }

export default App;
