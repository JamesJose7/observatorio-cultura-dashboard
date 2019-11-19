import React from 'react'
import '../../App.css'
import config from '../../config'
import koboApi from '../../koboApi'
import DataTable from 'react-data-table-component';
import {Dropdown, Button, ButtonGroup, Modal} from "react-bootstrap";
import {ResponsiveBar} from "@nivo/bar";
import {ResponsivePie} from "@nivo/pie";
import LoadingOverlay from 'react-loading-overlay';
import axios from 'axios'
import $ from 'jquery'
import {BounceLoader} from "react-spinners";

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
        rowsData: [],
        columns: [],
        choicesLabels: {},
        error: null,
        currentForm: this.props.forms[0], // select first form by default
        showFormSelector: false,
        cachedForms: [],
        // Graphs
        lastAnswerDate: '-',
        avgAnswersPerDay: 0,
        dateGraphData: [],
        pieChartData: []
    }

    fetchFormMetadata() {
        // Get form metadata url
        let url = `${config.corsProxy}${koboApi.urls().formMetadata(this.state.currentForm.id)}`

        function filterRequiredMetadata(data) {
            let columns = []
            let choicesLabels = {}
            // Get column names and format them according to data labels
            data.content.survey.forEach(col => {
                if (col.label) {
                    if (!(col.label[0].length === 0 || !col.label[0].trim())) { // Check if label is empty
                        columns.push({
                            name: col.label[0],
                            selector: col.name,
                            type: col.type,
                            sortable: true
                        })
                    }
                }
            })
            // Get array of label choices with their id values to replace them when fetching data
            data.content.choices.forEach(choice => {
                if (choice.label)
                    if (!(choice.label[0].length === 0 || !choice.label[0].trim())) // Check if label is empty
                        choicesLabels[choice.name] = choice.label[0]
            })
            // Get form link
            let formLink = data.deployment__links.offline_url

            // Return required metadata
            return {
                formLink: formLink,
                columns: columns,
                choices: choicesLabels
            }
        }

        axios.get(url, options)
            .then((response) => response.data)
            .then(data => filterRequiredMetadata(data)) // Get only the columns from the metadata
            .then(data =>
                this.setState({
                    columns: data.columns,
                    choicesLabels: data.choices,
                    formLink: data.formLink
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

    countValuesRepetitions(data, val) {
        let counts = {}
        data.forEach(function (x) {
            counts[x[val]] = (counts[x[val]] || 0) + 1;
        })
        return counts
    }

    convertToEstTime(date) {
        let offset = -300; //Timezone offset for EST in minutes.
        return new Date(date.getTime() + offset*60*1000);
    }

    updateDashboard = arg => {
        // Hide all tables and show only the currently selected one
        $('.form-table-container').css("display", "none")
        $('#' + this.state.currentForm.id).css("display", "block")

        // json response data
        const submissions = this.getCachedForm(this.state.currentForm).data
        const columns = this.getCachedForm(this.state.currentForm).columns

        // Filter columns that are eligible for pie charting
        let pieChartColumns = []
        let pieChartData = []
        columns.forEach(col => {
            if (col.type === 'select_one')
                pieChartColumns.push(col)
        })

        // Count value repetitions for each question
        pieChartColumns.forEach(pieCol => {
            // Repetition counts for each question
            let counts = this.countValuesRepetitions(submissions, pieCol.selector)
            //Create an object that will store the values
            let pieData = []
            for (let key in counts) {
                if (counts.hasOwnProperty(key)) {
                    if (key !== "undefined") {
                        pieData.push({
                            "id": key,
                            "label": key,
                            "value": counts[key]
                        })
                    }
                }
            }
            if (pieData.length > 0)
                pieChartData.push({
                    name: pieCol.name,
                    id: pieCol.selector,
                    data: pieData
                })
        })

        // Dashboard values
        let dates = []
        let simpleDates = []
        submissions.forEach(submission => {
            dates.push({fecha: (new Date(submission._submission_time)).toLocaleDateString()}) // Get date from timestamp
            simpleDates.push(submission._submission_time) // Get simple dates for sorting
        })

        // Build submission date data for bar graph
        let datesCounts = this.countValuesRepetitions(dates, 'fecha')
        let dateGraphData = []
        for (let key in datesCounts) {
            if (datesCounts.hasOwnProperty(key))
                dateGraphData.push({
                    fecha: key.toString(),
                    respuestas: datesCounts[key]
                })
        }

        let rowsData = []
        /*if (columns) {
            submissions.forEach(row => {
                let rowData = []
                columns.forEach(col => {
                    if (submissions && submissions.length > 0)
                        rowData.push(row[col.selector])
                })
                rowsData.push(rowData)
            })
        }*/


        // Average answers per day
        let avgAnswersPerDay = 0
        if (dates.length > 0)
            avgAnswersPerDay = dates.length / Object.keys(datesCounts).length

        // Last answer
        let lastAnswerDate = "N/A"
        simpleDates = simpleDates.sort() // Sort dates to get the latest one
        if (submissions.length > 0)
            lastAnswerDate = this.convertToEstTime(new Date(simpleDates[simpleDates.length-1])).toLocaleString()

        // setting state
        this.setState({
            lastAnswerDate: lastAnswerDate,
            avgAnswersPerDay: avgAnswersPerDay,
            dateGraphData: dateGraphData,
            pieChartData: pieChartData,
            rowsData: rowsData,
            isLoading: false
        })
    }

    cacheForm() {
        let s = this.state;
        // Add new form to cache
        let newForm = {
            id: s.currentForm.id,
            name: s.currentForm.name,
            formLink: s.formLink,
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
        const {isLoading, error, currentForm, rowsData, pieChartData} = this.state

        let currentFormData = this.getCachedForm(currentForm)

        if (!currentFormData)
            currentFormData = { // Return empty object when none is found
                columns: [],
                data: [],
                formLink: "",
                id: "",
                name: ""
            }

        function round(num) {
            let rounded = parseFloat(Math.round(num * 100) / 100).toFixed(2)
                if (rounded > 0.00)
                    return rounded
            return 0
        }

        return (
            <div>
                {/*Display a message if we encounter an error*/}
                {error ? <p>{error.message}</p> : null}

                {/*// data check*/}
                {!isLoading ? (
                    <div className="container-fluid summary-dashboard">

                        <div id="dashboard-header">
                            <div className="row">
                                <div className="col-lg-6">
                                    <h1>{currentFormData.name}</h1>
                                </div>
                                <div className="col-lg-6">
                                        <div className="form-actions">
                                            <Button variant="info" onClick={this.handleShowFormSelector}
                                                    className="menu-option float-right">
                                                Cambiar Formulario
                                                <i className="material-icons">
                                                    menu
                                                </i>
                                            </Button>

                                            <Button variant="info"
                                                    href={currentFormData.formLink}
                                                    target="_blank"
                                                    className="menu-option float-lg-right float-sm-left">
                                                Abrir formulario
                                                <i className="material-icons">
                                                    open_in_new
                                                </i>
                                            </Button>
                                        </div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-lg-4 col-xl-3">
                                <LoadingOverlay
                                    active={isLoading}
                                    spinner={<BounceLoader color={'#ffc107'} />}
                                >
                                    <div className="card">
                                        <div className="card-heading">
                                            <h2>Resumen</h2>
                                        </div>
                                        <div className="form-summary-data parallel-card-body">
                                            <span>Total de respuestas</span>
                                            <p>{ currentFormData.data.length }</p>
                                            <span>Respuestas por día</span>
                                            <p>{round(this.state.avgAnswersPerDay)}</p>
                                            <span>Última respuesta</span>
                                            <p>{this.state.lastAnswerDate}</p>
                                        </div>
                                    </div>
                                </LoadingOverlay>
                            </div>
                            <div className="col-lg-8 col-xl-9">
                                <LoadingOverlay
                                    active={isLoading}
                                    spinner={<BounceLoader color={'#ffc107'} />}
                                >
                                    <div className="card">
                                        <div className="card-heading">
                                            <h2>Respuestas por fecha</h2>
                                        </div>
                                        <div className="parallel-card-body">
                                            <ResponsiveBar
                                                data={this.state.dateGraphData}
                                                keys={[ 'respuestas' ]}
                                                indexBy="fecha"
                                                margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                                                padding={0.3}
                                                colors={{ scheme: 'category10' }}
                                                defs={[
                                                    {
                                                        id: 'dots',
                                                        type: 'patternDots',
                                                        background: 'inherit',
                                                        color: '#3584bb',
                                                        size: 4,
                                                        padding: 1,
                                                        stagger: true
                                                    },
                                                    {
                                                        id: 'lines',
                                                        type: 'patternLines',
                                                        background: 'inherit',
                                                        color: '#3584bb',
                                                        rotation: -45,
                                                        lineWidth: 6,
                                                        spacing: 10
                                                    }
                                                ]}
                                                fill={[
                                                    {
                                                        match: {
                                                            id: 'respuestas'
                                                        },
                                                        id: 'lines'
                                                    }
                                                ]}
                                                borderColor={{ from: 'color', modifiers: [ [ 'darker', 1.6 ] ] }}
                                                axisTop={null}
                                                axisRight={null}
                                                axisBottom={{
                                                    tickSize: 5,
                                                    tickPadding: 5,
                                                    tickRotation: 0,
                                                    legend: 'Fecha',
                                                    legendPosition: 'middle',
                                                    legendOffset: 32
                                                }}
                                                axisLeft={{
                                                    tickSize: 5,
                                                    tickPadding: 5,
                                                    tickRotation: 0,
                                                    legend: '# de respuestas',
                                                    legendPosition: 'middle',
                                                    legendOffset: -40
                                                }}
                                                labelSkipWidth={12}
                                                labelSkipHeight={12}
                                                labelTextColor={{ from: 'color', modifiers: [ [ 'darker', 1.6 ] ] }}
                                                legends={[
                                                    {
                                                        dataFrom: 'keys',
                                                        anchor: 'bottom-right',
                                                        direction: 'column',
                                                        justify: false,
                                                        translateX: 120,
                                                        translateY: 0,
                                                        itemsSpacing: 2,
                                                        itemWidth: 100,
                                                        itemHeight: 20,
                                                        itemDirection: 'left-to-right',
                                                        itemOpacity: 0.85,
                                                        symbolSize: 20,
                                                        effects: [
                                                            {
                                                                on: 'hover',
                                                                style: {
                                                                    itemOpacity: 1
                                                                }
                                                            }
                                                        ]
                                                    }
                                                ]}
                                                animate={true}
                                                motionStiffness={90}
                                                motionDamping={15}
                                            />
                                        </div>
                                    </div>
                                </LoadingOverlay>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-12">
                                <LoadingOverlay
                                    active={isLoading}
                                    spinner={<BounceLoader color={'#ffc107'} />}
                                >
                                    <div className="card" style={{minHeight: "auto"}}>
                                        <div className="row mb-4">
                                            <div className="col-8 card-heading">
                                                <h2>Datos del formulario</h2>
                                            </div>
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
                                        <div className="row">
                                            {pieChartData.map(question => (
                                                <div className="col-lg-6 mb-4" key={question.id}>
                                                    <h5>{question.name}</h5>
                                                    <div className="chart-container">
                                                        <ResponsivePie
                                                            title
                                                            data={question.data}
                                                            margin={{ top: 30, right: 30, bottom: 30, left: 80 }}
                                                            innerRadius={0.5}
                                                            padAngle={0.7}
                                                            cornerRadius={3}
                                                            colors={{ scheme: 'paired' }}
                                                            borderWidth={1}
                                                            borderColor={{ from: 'color', modifiers: [ [ 'darker', 0.2 ] ] }}
                                                            enableRadialLabels={false}
                                                            slicesLabelsSkipAngle={10}
                                                            slicesLabelsTextColor="#333333"
                                                            animate={true}
                                                            motionStiffness={90}
                                                            motionDamping={15}
                                                            legends={[
                                                                {
                                                                    anchor: 'left',
                                                                    direction: 'column',
                                                                    translateX: -50,
                                                                    itemWidth: 20,
                                                                    itemHeight: 40,
                                                                    itemTextColor: '#999',
                                                                    symbolSize: 18,
                                                                    symbolShape: 'circle',
                                                                    effects: [
                                                                        {
                                                                            on: 'hover',
                                                                            style: {
                                                                                itemTextColor: '#000'
                                                                            }
                                                                        }
                                                                    ]
                                                                }
                                                            ]}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {/*<ResponsiveTable columns={currentFormData.columns} data={rowsData}/>*/}
                                        {/*{cachedForms.map(
                                            form => (
                                                <div id={form.id} key={form.id} className="form-table-container">
                                                    <Table name={form.name} columns={form.columns} data={form.data}/>
                                                </div>
                                            )
                                        )}*/}
                                    </div>
                                </LoadingOverlay>
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
                                <Modal.Title>Cambiar formulario</Modal.Title>
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
                    <div className="placeholder container-fluid summary-dashboard">
                        {/*<div className="row align-items-center" style={{minHeight: "80vh"}}>
                            <div className="col-6 mx-auto">
                                <h1 className="text-center">Cargando...</h1>
                            </div>
                        </div>*/}

                        <div id="dashboard-header">
                            <div className="row">
                                <div className="col-lg-6">
                                    <h1>-</h1>
                                </div>
                                <div className="col-lg-6">
                                    <div className="form-actions">
                                        <Button variant="info"
                                                className="menu-option float-right">
                                            Cambiar Formulario
                                            <i className="material-icons">
                                                menu
                                            </i>
                                        </Button>

                                        <Button variant="info"
                                                className="menu-option float-lg-right float-sm-left">
                                            Abrir formulario
                                            <i className="material-icons">
                                                open_in_new
                                            </i>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-lg-4 col-xl-3">
                                <LoadingOverlay
                                    active={true}
                                    spinner={<BounceLoader color={'#ffc107'} />}
                                >
                                    <div className="card">
                                        <div className="card-heading">
                                            <h2>Resumen</h2>
                                        </div>
                                        <div className="form-summary-data parallel-card-body">
                                            <span>Total de respuestas</span>
                                            <p>0</p>
                                            <span>Respuestas por día</span>
                                            <p>0</p>
                                            <span>Última respuesta</span>
                                            <p>-</p>
                                        </div>
                                    </div>
                                </LoadingOverlay>
                            </div>
                            <div className="col-lg-8 col-xl-9">
                                <LoadingOverlay
                                    active={true}
                                    spinner={<BounceLoader color={'#ffc107'} />}
                                >
                                    <div className="card">
                                        <div className="card-heading">
                                            <h2>Respuestas por fecha</h2>
                                        </div>
                                        <div className="chart-container parallel-card-body">

                                        </div>
                                    </div>
                                </LoadingOverlay>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-12">
                                <LoadingOverlay
                                    active={true}
                                    spinner={<BounceLoader color={'#ffc107'} />}
                                >
                                    <div className="card" style={{minHeight: "auto"}}>
                                        <div className="row mb-4">
                                            <h2 className="col-8">Datos del formulario</h2>
                                            <div className="col-4">
                                                <Dropdown as={ButtonGroup} className="float-right">
                                                    <Button disabled={true} variant="outline-primary">
                                                        Descargar
                                                    </Button>

                                                    <Dropdown.Toggle split variant="primary" id="dropdown-split-basic"/>

                                                    <Dropdown.Menu drop={'left'}>
                                                        <Dropdown.Item>CSV</Dropdown.Item>
                                                        <Dropdown.Item>XLSX</Dropdown.Item>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </div>
                                        </div>
                                        <div className="form-table-container">

                                        </div>
                                    </div>
                                </LoadingOverlay>
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
        fixedHeader
        fixedHeaderScrollHeight="300px"
        highlightOnHover
        noHeader={true}
        // selectableRows={true}
        pagination
    />;
}

export default SummaryDashboard
