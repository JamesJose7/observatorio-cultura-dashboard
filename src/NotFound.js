import React from "react";
import styled from "styled-components";

const NotFoundContainer = styled.div`
    text-align: center;
    padding: 50px 0;
`;

const ErrorIcon = styled.i`
    font-size: 3.2em;
    margin-bottom: .25em;
    color: firebrick;
`;

const StatusNumber = styled.h1`
    font-size: 4em;
    font-weight: bold;
    margin-bottom: .25em;
    color: firebrick;
`;

const NotFound = () => (
    <NotFoundContainer>
        <ErrorIcon className="material-icons icn-error">error_outline</ErrorIcon>
        <StatusNumber>404</StatusNumber>
        <h2>Página No Encontrada</h2>
    </NotFoundContainer>
);

export default NotFound
