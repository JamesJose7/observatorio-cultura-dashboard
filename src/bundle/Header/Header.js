import React from 'react'
import '../../App.css'
import {Nav} from "react-bootstrap";

class Header extends React.Component {
    render() {

        return(
            <header>
                <Nav className="navbar navbar-expand-lg is-white is-dark-text container-fluid">
                    <div className="navbar-brand h1 mb-0 text-large font-medium">
                        UTPL - Observatorio Cultural
                    </div>
                    <div className="navbar-nav ml-auto">
                        <div className="form-detail-section">
                            <span className="pr-2">Form 1</span>
                        </div>
                    </div>
                </Nav>
            </header>
        )
    }
}

export default Header
