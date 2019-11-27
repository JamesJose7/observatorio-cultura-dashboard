import React from 'react';
import './App.css';
import Header from "./bundle/Header/Header";
import SummaryDashboard from "./bundle/Dashboard/SummaryDashboard";
import AuthenticationService from "./bundle/Auth/AuthenticationService";
import axios from 'axios'
import koboApi from "./koboApi";

class App extends React.Component {

    state = {
        isLoggedIn: false,
        isAuthComplete: false,
        userForms: null,
        userHasForms: false,
        loggedUsername: ''
    }

    changeLoginState(state) {
        // Get state from LoginModal
        this.setState({isAuthComplete: state},
            () => this.retrieveUserForms())
    }

    componentDidMount() {
        // Check if the user has logged in already in the current session
        if (AuthenticationService.isUserLoggedIn())
            AuthenticationService.renewBasicAuthenticationService() // Renew the authentication
                .then(() => AuthenticationService.renewSuccessfulLogin(AuthenticationService.getLoggedInSession())) // Renew the auth headers on every consequent request
                .then(() => this.setState({isAuthComplete: true}, // Notify state that the authentication is complete
                    () => this.retrieveUserForms()))
                .catch(error => console.log(error))
    }

    retrieveUserForms() {
        if (this.state.isAuthComplete)
            axios.get(koboApi.urls().userForms)
                .then((response) => this.setState({
                    userForms: response.data,
                    loggedUsername: response.data.utplUser
                }, () => {
                    let userForms = this.state.userForms
                    if (userForms)
                        if (userForms.forms.length > 0) this.setState({userHasForms: true})
                        else this.setState({userHasForms: false})
                }))
                .catch(error => console.log(error))
    }

    render() {

        const {isAuthComplete, userHasForms, userForms} = this.state

        return (
            <div className="App">
                <Header
                    isLoggedIn={AuthenticationService.isUserLoggedIn()}
                    changeLogin={this.changeLoginState.bind(this)}
                    loggedUsername={this.state.loggedUsername}
                />

                {isAuthComplete && userHasForms ? (
                    <SummaryDashboard
                        isLoggedIn={AuthenticationService.isUserLoggedIn()}
                        forms={userForms.forms}
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
