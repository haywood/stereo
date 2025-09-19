import React from 'react';
import logo from './logo.svg';
import PatternCanvas from './PatternCanvas';
import ControlOverlay from './ControlOverlay';
import './App.css';

function App() {
  return (
    <div className="app">
      <PatternCanvas></PatternCanvas>
      <ControlOverlay></ControlOverlay>
    </div>
  );
}

export default App;
