import axios from 'axios'
import koboApi from "../../koboApi";

export const SESSION_ATTRIBUTE_NAME = 'session'
export const USER_NAME_ATTRIBUTE_NAME = 'authenticatedUser'

class AuthenticationService {

    executeBasicAuthenticationService(username, password) {
        return axios.get(koboApi.urls().login,
            { headers: { authorization: this.createBasicAuthToken(username, password) } })
    }

    renewBasicAuthenticationService() {
        return axios.get(koboApi.urls().login,
            { headers: { authorization: this.getLoggedInSession() } })
    }

    createBasicAuthToken(username, password) {
        return 'Basic ' + window.btoa(username + ":" + password)
    }

    registerSuccessfulLogin(username, password) {
        sessionStorage.setItem(SESSION_ATTRIBUTE_NAME, this.createBasicAuthToken(username, password))
        this.setupAxiosInterceptors(this.createBasicAuthToken(username, password))
    }

    renewSuccessfulLogin(sessionToken) {
        this.setupAxiosInterceptors(sessionToken)
    }

    logout() {
        sessionStorage.removeItem(SESSION_ATTRIBUTE_NAME);
    }

    isUserLoggedIn() {
        let user = sessionStorage.getItem(SESSION_ATTRIBUTE_NAME)
        if (user === null) return false
        return true
    }

    getLoggedInSession() {
        let user = sessionStorage.getItem(SESSION_ATTRIBUTE_NAME)
        if (user === null) return ''
        return user
    }

    setupAxiosInterceptors(token) {
        axios.interceptors.request.use(
            (config) => {
                if (this.isUserLoggedIn()) {
                    config.headers.authorization = token
                }
                return config
            }
        )
    }
}

export default new AuthenticationService()
