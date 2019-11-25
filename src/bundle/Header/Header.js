import React from 'react'
import '../../App.css'
import logo from './utpl_logo.png'
import {Nav, Navbar} from "react-bootstrap";
import LoginModal from "../Login/LoginModal";

class Header extends React.Component {

    state = {
        showLoginModal: false
    }

    handleShowLoginModal = () => this.setState({showLoginModal: true})
    handleCloseLoginModal = () => this.setState({showLoginModal: false})

    render() {

        return(
            <header>
                <Navbar bg="utpl" expand="lg">
                    <div className="container-fluid p-0">
                        <Navbar.Brand href="#home">
                            <img
                                alt=""
                                src={logo}
                                width="80"
                                height="30"
                                className="d-inline-block align-top"
                            />{' '}
                            Visualizador de Formularios
                        </Navbar.Brand>
                        <Navbar.Toggle aria-controls="basic-navbar-nav" className="navbar-dark" />
                        <Navbar.Collapse id="basic-navbar-nav">
                            <Nav className="ml-auto">
                                <Nav.Link href="#" onClick={this.handleShowLoginModal.bind(this)}>Iniciar sesión</Nav.Link>
                            </Nav>
                        </Navbar.Collapse>
                    </div>
                </Navbar>

                <LoginModal showLoginModal={this.state.showLoginModal} handleCloseLoginModal={this.handleCloseLoginModal} />
            </header>
        )
    }
}

export default Header
