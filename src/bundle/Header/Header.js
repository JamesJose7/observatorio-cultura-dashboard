import React from 'react'
import '../../App.css'
import {Nav} from "react-bootstrap";

class Header extends React.Component {
    render() {

        return(
            <header>
                <Nav className="navbar navbar-expand-lg is-white is-dark-text container-fluid">
                    {/*<div className="navbar-brand mb-0 text-large font-medium">
                        <h1>UTPL - Visualizador de Formularios</h1>
                    </div>*/}
                    <h1>UTPL - Visualizador de Formularios</h1>
                    {/*<div className="navbar-nav ml-auto">
                        <div className="form-detail-section">
                            <span className="pr-2"></span>
                        </div>
                    </div>*/}
                </Nav>
            </header>
        )
    }
}

export default Header
