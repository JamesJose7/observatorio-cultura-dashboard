import React from 'react';
import './App.css';
import Header from "./bundle/Header/Header";
import FormDashboard from "./bundle/Dashboard/FormDashboard";


function App() {
  return (
    <div className="App">
      <Header/>

      <div className="container">

        <FormDashboard/>

      </div>
    </div>
  );
}

export default App;
