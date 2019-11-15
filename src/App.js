import React from 'react';
import './App.css';
import Header from "./bundle/Header/Header";
import SummaryDashboard from "./bundle/Dashboard/SummaryDashboard";

const availableForms = [
    /*{
        name: "Escenarios publicos",
        id: "abSepFikh7Kh6E6dwrbxAq"
    },
    {
        name: "Productores",
        id: "aTfZfTtvncTL6KofWurqZ8"
    },
    {
        name: "Escenarios privados",
        id: "anEhhXYWggZGvJJ4PtpT5Z"
    },*/
    {
        name: "Capacitadores",
        id: "axwZy8ApV3CGjt6EpFguHA"
    },
    {
        name: "Productores",
        id: "aZgJbmtwVSLQjAgbs3dNuP"
    },
    {
        name: "Artistas",
        id: "ap4PmjwkjyF5M7tYEHAors"
    }
]


function App() {
    return (
        <div className="App">
            <Header/>

            <SummaryDashboard
                forms={availableForms}
            />

            {/*<FormDashboard
                formName={"Escenarios públicos"}
                submissionsLink={"https://kc.kobotoolbox.org/jeeguiguren/reports/abSepFikh7Kh6E6dwrbxAq/export.xlsx"}
            />*/}

        </div>
    );
}

export default App;
