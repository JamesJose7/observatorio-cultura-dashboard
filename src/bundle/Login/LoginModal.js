import React from 'react'
import '../../App.css'
import {Button, Form, Modal} from "react-bootstrap"
import $ from 'jquery'
import AuthenticationService from "../Auth/AuthenticationService";

import ReactGA from 'react-ga';


class LoginModal extends React.Component {

    state = {
        hasLoginFailed: false,
        isLoading: false
    }

    handleChange(event) {
        this.setState(
            {
                [event.target.name]
                    : event.target.value
            }
        )
    }

    componentDidMount() {
        // Show modal if the user is not logged in
        if (!this.props.isLoggedIn)
            this.props.handleShowLoginModal()
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        // Close modal if the user has logged in already
        if (prevProps.isLoggedIn !== this.props.isLoggedIn) {
            if (this.props.isLoggedIn)
                this.props.handleCloseLoginModal()
        }
    }

    render() {

        const {isLoading, hasLoginFailed} = this.state

        const handleGuestLogin = event => {
            // GA Event
            ReactGA.event({
                category: 'Login',
                action: 'Guest Login'
            });
            // Button loading
            this.setState({isLoading: true})
            authenticate('invitado', '123')
        }

        const handleSubmit = event => {
            // GA Event
            ReactGA.event({
                category: 'Login',
                action: 'Credentials Login'
            });
            const form = event.currentTarget
            // Prevent page reloading
            event.preventDefault()
            event.stopPropagation()

            // Button loading
            this.setState({isLoading: true})

            // Retrieve username and password from form
            let user = $(form).find('#formUser').val()
            let pass = $(form).find('#formPassword').val()

            authenticate(user, pass)
        }

        const authenticate = (user, pass) => {
            // Execute authentication in authentication service
            AuthenticationService
                .executeBasicAuthenticationService(user, pass)
                .then(() => {
                    AuthenticationService.registerSuccessfulLogin(user, pass) // Register the login in session storage
                    this.setState({
                        isLoading: false // Change the state of the button
                    }, () => this.props.changeLogin(true)) // Notify the login has been complete and show the user's content
                })
                .then(() => this.props.handleCloseLoginModal()) // Close the modal after successful login
                .catch(() => { // Catch errors and show error message
                    this.setState({
                        hasLoginFailed: true,
                        isLoading: false
                    })
                })
        }

        return (
            <Modal
                show={this.props.showLoginModal}
                onHide={this.props.handleCloseLoginModal}
                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Iniciar sesión</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {hasLoginFailed ? <p className="text-danger">Credenciales inválidas, intente de nuevo por favor</p> : ''}
                    <Form onSubmit={handleSubmit.bind(this)}>
                        <Form.Group controlId="formUser">
                            <Form.Label>Usuario</Form.Label>
                            <Form.Control type="text" placeholder="Usuario" />
                            <Form.Text className="text-muted">
                                Puedes usar tus credenciales de la UTPL
                            </Form.Text>
                        </Form.Group>

                        <Form.Group controlId="formPassword">
                            <Form.Label>Contraseña</Form.Label>
                            <Form.Control type="password" placeholder="Contraseña" />
                        </Form.Group>
                        <Button variant="primary" type="submit"
                                disabled={isLoading}
                            >
                            {isLoading ? 'Cargando…' : 'Ingresar'}
                        </Button>
                        <Button variant="info" type="button"
                                className="float-right"
                                onClick={handleGuestLogin.bind(this)}
                        >
                            {isLoading ? 'Cargando…' : 'Invitado'}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        )
    }
}

export default LoginModal
