// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login'; 
import Register from './Register'; 
import MainPage from './MainPage';
import UserPage from './UserPage';
import TagPage from './TagPage'; 
import MapPage from "./MapPage";
import RecipePage from "./RecipePage";
//

function App() {

  return (
    <Router>
      <Routes>
        {/* 2. 각 페이지들이 Router 안에 있으므로 
               각 페이지 내부에서 쓰는 useNavigate는 정상 작동합니다. */}
        <Route path="/" element={<Login />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/user" element={<UserPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/recipe" element={<RecipePage />} />
        <Route path="/tagpage" element={<TagPage />} />
        <Route path="/map" element={<MapPage />} />
      </Routes>
    </Router>
  );
}

export default App;