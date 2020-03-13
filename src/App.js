import React from 'react';
import './App.css';
import Header from "./bundle/Header/Header";
import SummaryDashboard from "./bundle/Dashboard/SummaryDashboard";
import AuthenticationService from "./bundle/Auth/AuthenticationService";
import axios from 'axios'
import koboApi from "./koboApi";

import ReactGA from 'react-ga';

import {
    BrowserRouter,
    Route,
    Switch
} from 'react-router-dom';

import {createBrowserHistory} from 'history';
import NotFound from "./NotFound";

const history = createBrowserHistory({
    basename: process.env.PUBLIC_URL
});

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
        // Initialize Google Analytics
        // Google Analytics
        ReactGA.initialize('UA-122300566-4');
        ReactGA.pageview('/');
        // Check if the user has logged in already in the current session
        if (AuthenticationService.isUserLoggedIn())
            this.renewLoginSession()
    }

    renewLoginSession() {
        // GA Event
        ReactGA.event({
            category: 'Login',
            action: 'Renewed session',
            label: 'Refresh'
        });
        AuthenticationService.renewBasicAuthenticationService() // Renew the authentication
            .then(() => AuthenticationService.renewSuccessfulLogin(AuthenticationService.getLoggedInSession())) // Renew the auth headers on every consequent request
            .then(() => this.setState({isAuthComplete: true}, // Notify state that the authentication is complete
                () => this.retrieveUserForms()))
            .catch(error => console.log('There was a problem logging to that user'))
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
                .catch(error => console.log('There was a problem retrieving the user`s data'))
    }

    render() {

        const {isAuthComplete, userHasForms, userForms} = this.state

        return (
            <BrowserRouter history={history} basename="koboPolls">
                <div className="App">
                    <Switch>
                        <Route exact path="/dashboard" component={(props) => (
                            <React.Fragment>
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
                            </React.Fragment>
                        )
                        }/>
                        <Route component={NotFound}/>
                    </Switch>

                    {/*<FormDashboard
                    formName={"Escenarios públicos"}
                    submissionsLink={"https://kc.kobotoolbox.org/jeeguiguren/reports/abSepFikh7Kh6E6dwrbxAq/export.xlsx"}
                />*/}

                </div>
            </BrowserRouter>
        )
    }
}

export default App;
