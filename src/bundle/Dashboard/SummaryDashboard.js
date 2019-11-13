import React, {Component, useState} from 'react'
import '../../App.css'
import config from '../../config'
import koboApi from '../../koboApi'
import DataTable from 'react-data-table-component';
import lodash from 'lodash'
import {Dropdown, Button, ButtonGroup, Modal} from "react-bootstrap";
import axios from 'axios'
import $ from 'jquery'

const CancelToken = axios.CancelToken;
let cancelMeta;
const options = {
    headers: {
        'Authorization': config.koboToken,
        'X-Requested-With': 'application/json'
    },
    cancelToken: new CancelToken(function executor(c) {
        // An executor function receives a cancel function as a parameter
        cancelMeta = c;
    })
}

class SummaryDashboard extends React.Component {
    state = {
        isLoading: true,
        data: [],
        columns: [],
        choicesLabels: {},
        error: null,
        currentForm: this.props.forms[0], // select first form by default
        showFormSelector: false,
        cachedForms: []
    }

    fetchFormMetadata() {
        // Get form metadata url
        let url = `${config.corsProxy}${koboApi.urls().formMetadata(this.state.currentForm.id)}`

        function formatColumnsAndChoices(data) {
            let columns = []
            let choicesLabels = {}
            // Get column names and format them according to data labels
            data.content.survey.forEach(col => {
                if (col.label) {
                    if (!(col.label[0].length === 0 || !col.label[0].trim())) { // Check if label is empty
                        columns.push({
                            name: col.label[0],
                            selector: col.name,
                            sortable: true
                        })
                    }
                }
            })
            data.content.choices.forEach(choice => {
                if (choice.label)
                    if (!(choice.label[0].length === 0 || !choice.label[0].trim())) // Check if label is empty
                        choicesLabels[choice.name] = choice.label[0]
            })
            // Get array of label choices with their id values to replace them when fetching data
            return {
                columns: columns,
                choices: choicesLabels
            }
        }

        axios.get(url, options)
            .then((response) => response.data)
            .then(data => formatColumnsAndChoices(data)) // Get only the columns from the metadata
            .then(data =>
                this.setState({
                    columns: data.columns,
                    choicesLabels: data.choices
                }, () => this.fetchFormData())) // Fetch form data once the state has successfully changed
            .catch(error => this.setState({error, isLoading: false}));
    }

    fetchFormData() {
        // Get form submissions url
        let url = `${config.corsProxy}${koboApi.urls().formSubmissions(this.state.currentForm.id)}`

        function cleanResponses(data, choicesLabels) {
            // Change every value from their ID into their actual label
            data.forEach(response => {
                for (let key in response)
                    if (response.hasOwnProperty(key)) {
                        let val = response[key];
                        if (val)
                            if (choicesLabels[val]) // If the label is found, replace it with it's value
                                response[key] = choicesLabels[val]
                    }

            })

            return data
        }

        axios.get(url, options)
            .then((response) => response.data.results)
            .then(data => cleanResponses(data, this.state.choicesLabels))
            .then(data =>
                this.setState({
                    data: data,
                }, () => this.cacheForm()))// Cache form once the state has successfully changed
            .catch(error => this.setState({error, isLoading: false}));
    }

    updateDashboard = arg => {
        // Hide all tables and show only the currently selected one
        $('.form-table-container').css("display", "none")
        $('#' + this.state.currentForm.id).css("display", "block")

        // json response data
        const submissions = this.state.data

        // Dashboard values

        submissions.forEach(submission => {

        })

        // setting state
        this.setState({
            isLoading: false
        })
    }

    cacheForm() {
        let s = this.state;
        // Add new form to cache
        let newForm = {
            id: s.currentForm.id,
            name: s.currentForm.name,
            columns: s.columns,
            data: s.data
        }
        this.setState(prevState => ({
            cachedForms: [...prevState.cachedForms, newForm],
            isLoading: false
        }), () => this.updateDashboard()) // Update dashboard once finished
    }

    loadForm() {
        // Check if it's cached already
        if (!this.getCachedForm(this.state.currentForm)) { // If not, retrieve it and cache it
            this.fetchFormMetadata()
        } else{
            this.setState({
                isLoading: false
            }, () => this.updateDashboard()) // Update dashboard once finished
        }
    }

    getCachedForm(form) {
        for (let value of this.state.cachedForms)
            if (value.id === form.id)
                return value
        return false
    }

    componentDidMount() {
        this.loadForm()
    }

    componentWillUnmount() {
        cancelMeta()
    }

    changeSelectedForm(form) {
        // Close modal
        this.handleCloseFormSelector.apply()
        // Change state to new selected form
        this.setState({currentForm: form, isLoading: true}, () => this.loadForm())// Reload data once state is changed
    }

    handleShowFormSelector = () => this.setState({showFormSelector: true})
    handleCloseFormSelector = () => this.setState({showFormSelector: false})

    render() {
        const {isLoading, error, currentForm, cachedForms} = this.state

        let currentFormData = this.getCachedForm(currentForm)

        return (
            <div>
                {/*Display a message if we encounter an error*/}
                {error ? <p>{error.message}</p> : null}

                {/*// data check*/}
                {!isLoading ? (
                    <div className="container-fluid">
                        <div className="row">
                            <div className="col-lg-9">
                                <div className="card">
                                    <div className="card-heading">
                                        <h2>Summary graphs here</h2>
                                    </div>
                                    <div className="card-value form-stats">
                                        {currentFormData.data.length} respuestas totales
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-3">
                                <div className="card">
                                    <div className="card-heading">
                                        <h2>Acciones</h2>
                                    </div>
                                    <div className="form-actions">
                                        <Button variant="outline-primary" onClick={this.handleShowFormSelector}
                                                className="w-100">
                                            Seleccionar Formulario
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-12">
                                <div className="card">
                                    <div className="row">
                                        <h2 className="col-8">Datos del formulario</h2>
                                        <div className="col-4">
                                            <Dropdown as={ButtonGroup} className="float-right">
                                                <Button disabled={true} variant="outline-primary">
                                                    Descargar
                                                </Button>

                                                <Dropdown.Toggle split variant="primary" id="dropdown-split-basic"/>

                                                <Dropdown.Menu drop={'left'}>
                                                    <Dropdown.Item href={koboApi.urls().downloadSubmissions({id: currentForm.id, format: 'csv'})}>CSV</Dropdown.Item>
                                                    <Dropdown.Item href={koboApi.urls().downloadSubmissions({id: currentForm.id, format: 'xlsx'})}>XLSX</Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </div>
                                    </div>
                                    {cachedForms.map(
                                        form => (
                                            <div id={form.id} key={form.id} className="form-table-container">
                                                <Table name={form.name} columns={form.columns} data={form.data}/>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        <Modal
                            show={this.state.showFormSelector}
                            onHide={this.handleCloseFormSelector}
                            size="lg"
                            aria-labelledby="contained-modal-title-vcenter"
                            centered
                        >
                            <Modal.Header closeButton>
                                <Modal.Title>Seleccionar formulario</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <ButtonGroup vertical>
                                    {this.props.forms.map(
                                        form => (
                                            <Button variant="link" className="text-left" key={form.id}
                                                    onClick={() => this.changeSelectedForm(form)}>{form.name}</Button>
                                        )
                                    )}
                                </ButtonGroup>
                            </Modal.Body>
                        </Modal>
                    </div>


                    // If there is a delay in data, let's let the user know it's loading
                ) : (
                    <div className="placeholder container-fluid">
                        <div className="row align-items-center" style={{minHeight: "80vh"}}>
                            <div className="col-6 mx-auto">
                                <h1 className="text-center">Loading...</h1>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }
}

function Table(props) {
    return <DataTable
        keyField={props.id}
        title={props.name}
        columns={props.columns}
        data={props.data}
        selectableRows={true}
    />;
}

export default SummaryDashboard
