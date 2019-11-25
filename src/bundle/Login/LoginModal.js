import React from 'react'
import '../../App.css'
import {Modal} from "react-bootstrap";


class LoginModal extends React.Component {

    render() {

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


                </Modal.Body>
            </Modal>
        )
    }
}

export default LoginModal
