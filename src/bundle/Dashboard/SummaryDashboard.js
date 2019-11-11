import React from 'react'
import '../../App.css'
import config from '../../config'
import koboApi from '../../koboApi'
import DataTable from 'react-data-table-component';
import lodash from 'lodash'
import {Dropdown, Button, ButtonGroup} from "react-bootstrap";

class SummaryDashboard extends React.Component {
    state = {
        isLoading: true,
        data: [],
        columns: [],
        error: null
    }

    fetchFormMetadata() {
        // Get form metadata url
        let url = `${config.corsProxy}${koboApi.urls().formMetadata(this.props.formId)}`

        function formatColumns(data) {
            let columns = []
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
            return columns
        }

        fetch(url, {
            headers: new Headers({
                'Authorization': config.koboToken,
                'X-Requested-With': 'application/json'
            }),
        })
        // get the API response and receive data in JSON format
            .then(response => response.json())
            // Update data state
            .then(data =>
                this.setState({
                    columns: formatColumns(data),
                    isLoading: false,
                })
            )
            // Catch any errors we hit and update the app
            .catch(error => this.setState({error, isLoading: false}));
    }

    fetchFormData() {
        // Get form submissions url
        let url = `${config.corsProxy}${koboApi.urls().formSubmissions(this.props.formId)}`

        fetch(url, {
            headers: new Headers({
                'Authorization': config.koboToken,
                'X-Requested-With': 'application/json'
            }),
        })
        // get the API response and receive data in JSON format
            .then(response => response.json())
            // Update data state
            .then(data =>
                this.setState({
                    data: data.results,
                    isLoading: false,
                }, () => this.getData())
            )
            // Catch any errors we hit and update the app
            .catch(error => this.setState({error, isLoading: false}));
    }

    getData = arg => {
        // json response data
        const submissions = this.state.data

        // Dashboard values

        submissions.forEach(submission => {

        })

        // setting state
        this.setState({

        })
    }

    componentDidMount() {
        this.fetchFormMetadata()
        this.fetchFormData()
    }

    render() {
        const {isLoading, columns, data, error} = this.state

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
                                </div>
                            </div>
                            <div className="col-lg-3">
                                <div className="card">
                                    <div className="card-heading">
                                        <h2>Acciones</h2>
                                    </div>
                                    <div className="form-actions">
                                        <div>
                                            <p>Form selector here</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-12">
                                <div className="card">
                                    <div className="row">
                                        <h2 className="col-8">Datos de formulario</h2>
                                        <div className="col-4">
                                            <Dropdown as={ButtonGroup} className="float-right">
                                                <Button disabled={true} variant="outline-primary">
                                                    Descargar
                                                </Button>

                                                <Dropdown.Toggle split variant="primary" id="dropdown-split-basic"/>

                                                <Dropdown.Menu drop={'left'}>
                                                    <Dropdown.Item href={koboApi.urls().downloadSubmissions({id: this.props.formId, format: 'csv'})}>CSV</Dropdown.Item>
                                                    <Dropdown.Item href={koboApi.urls().downloadSubmissions({id: this.props.formId, format: 'xlsx'})}>XLSX</Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </div>
                                    </div>
                                    <DataTable
                                        title={this.props.formName}
                                        columns={columns}
                                        data={data}
                                        selectableRows={true}
                                    />
                                </div>
                            </div>
                        </div>
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

export default SummaryDashboard
