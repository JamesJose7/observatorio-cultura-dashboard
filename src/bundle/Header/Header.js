import React from 'react'
import '../../App.css'
import logo from './utpl_logo.png'
import {Nav, Navbar} from "react-bootstrap";
import LoginModal from "../Login/LoginModal";
import AuthenticationService from "../Auth/AuthenticationService";

class Header extends React.Component {

    state = {
        showLoginModal: false
    }

    handleShowLoginModal = () => this.setState({showLoginModal: true})
    handleCloseLoginModal = () => this.setState({showLoginModal: false})

    closeSession = () => {
        // Close session from auth service
        AuthenticationService.logout()
        this.props.changeLogin(false)
        // Open login modal
        this.handleShowLoginModal()
    }

    render() {

        return(
            <header>
                <Navbar bg="utpl" expand="lg" className="navbar-dark">
                    <div className="container-fluid p-0">
                        <Navbar.Brand href="#home">
                            <img
                                alt=""
                                src={logo}
                                width="80"
                                height="30"
                                className="d-inline-block align-top"
                            />{' '}
                            <span className="d-none d-sm-inline-block">Visualizador de Formularios</span>
                            <span className="d-inline-block d-sm-none">Formularios</span>
                        </Navbar.Brand>
                        <Navbar.Toggle aria-controls="basic-navbar-nav" className="navbar-dark" />
                        <Navbar.Collapse id="basic-navbar-nav">
                            <Nav className="ml-auto text-right">
                                {this.props.isLoggedIn ? (
                                    <Nav.Link href="#" onClick={this.closeSession.bind(this)}><span className="logged-username">({this.props.loggedUsername})</span> Cerrar sesión</Nav.Link>
                                ) : (
                                    <Nav.Link href="#" onClick={this.handleShowLoginModal.bind(this)}>Iniciar sesión</Nav.Link>
                                )}
                            </Nav>
                        </Navbar.Collapse>
                    </div>
                </Navbar>

                <LoginModal
                    isLoggedIn={this.props.isLoggedIn}
                    changeLogin={this.props.changeLogin.bind(this)}
                    showLoginModal={this.state.showLoginModal}
                    handleShowLoginModal={this.handleShowLoginModal}
                    handleCloseLoginModal={this.handleCloseLoginModal} />
            </header>
        )
    }
}

export default Header
