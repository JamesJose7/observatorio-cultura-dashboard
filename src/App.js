import React from 'react';
import './App.css';
import Header from "./bundle/Header/Header";
import SummaryDashboard from "./bundle/Dashboard/SummaryDashboard";
import AuthenticationService from "./bundle/Auth/AuthenticationService";

const availableForms = [
    {
        name: "Formulario Participantes Capacitaciones",
        id: "a8yQxrA8y7Xc2pYfLX4m8X"
    },
    {
        name: "Formulario Capacitadores",
        id: "acuRRPzfembPskoJKZj3BN"
    },
    {
        name: "Formulario Productores",
        id: "aj9MtBq2aTkvpKe9cyrugT"
    },
    {
        name: "Formulario Espacios Escénicos",
        id: "akav2VC5oxhRSwxrpr49EX"
    },
    {
        name: "Formulario Artistas",
        id: "a2HxV6ApbufEsx3QtZgKuc"
    }
]


class App extends React.Component {

    state = {
        isLoggedIn: false,
        isAuthComplete: false
    }

    changeLoginState(state) {
        // Get state from LoginModal
        this.setState({isAuthComplete: state})
    }

    componentDidMount() {
        // Check if the user has logged in already in the current session
        if (AuthenticationService.isUserLoggedIn())
            AuthenticationService.renewBasicAuthenticationService() // Renew the authentication
                .then(() => AuthenticationService.renewSuccessfulLogin(AuthenticationService.getLoggedInSession())) // Renew the auth headers on every consequent request
                .then(() => this.setState({isAuthComplete: true})) // Notify state that the authentication is complete
                .catch(error => console.log(error))
    }

    render() {

        const {isAuthComplete} = this.state

        return (
            <div className="App">
                <Header
                    isLoggedIn={AuthenticationService.isUserLoggedIn()}
                    changeLogin={this.changeLoginState.bind(this)}
                />

                {isAuthComplete ? (
                    <SummaryDashboard
                        isLoggedIn={AuthenticationService.isUserLoggedIn()}
                        forms={availableForms}
                    />
                ) : (<div></div>)
                }

                {/*<FormDashboard
                formName={"Escenarios públicos"}
                submissionsLink={"https://kc.kobotoolbox.org/jeeguiguren/reports/abSepFikh7Kh6E6dwrbxAq/export.xlsx"}
            />*/}

            </div>
        )
    }
}

export default App;
