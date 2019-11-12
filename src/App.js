import React from 'react';
import './App.css';
import Header from "./bundle/Header/Header";
import FormDashboard from "./bundle/Dashboard/FormDashboard";
import SummaryDashboard from "./bundle/Dashboard/SummaryDashboard";

const availableForms = [
    {
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
    }
]


function App() {
    return (
        <div className="App">
            <Header/>

            <SummaryDashboard
                forms={availableForms}
                formId={'abSepFikh7Kh6E6dwrbxAq'}
                formName={'Test form'}
            />

            {/*<FormDashboard
                formName={"Escenarios públicos"}
                submissionsLink={"https://kc.kobotoolbox.org/jeeguiguren/reports/abSepFikh7Kh6E6dwrbxAq/export.xlsx"}
            />*/}

        </div>
    );
}

export default App;
