import React from 'react';
import './App.css';
import Header from "./bundle/Header/Header";
import FormDashboard from "./bundle/Dashboard/FormDashboard";


function App() {
    return (
        <div className="App">
            <Header/>

            <FormDashboard
                formName={"Escenarios públicos"}
                submissionsLink={"https://kc.kobotoolbox.org/jeeguiguren/reports/abSepFikh7Kh6E6dwrbxAq/export.xlsx"}
            />

        </div>
    );
}

export default App;
