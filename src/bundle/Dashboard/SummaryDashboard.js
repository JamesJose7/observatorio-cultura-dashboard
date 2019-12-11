import React from 'react'
import '../../App.css'
import koboApi from '../../koboApi'
import {Dropdown, Button, ButtonGroup, Modal} from "react-bootstrap";
import LoadingOverlay from 'react-loading-overlay';
import axios from 'axios'
import lodash from 'lodash'
import Utils from "../Utils/Utils";
import {BounceLoader} from "react-spinners";
import CustomPieChart from "../Charts/CustomPieChart";
import CustomBarChart from "../Charts/CustomBarChart";
import NumberStatistics from "../Charts/NumberStatistics";

import ReactGA from 'react-ga';
import WordCloudChart from "../Charts/WordCloudChart";

class SummaryDashboard extends React.Component {
    state = {
        isLoading: true,
        data: [],
        columns: [],
        choicesLabels: {},
        error: null,
        currentForm: this.props.forms[0], // select first form by default
        showFormSelector: false,
        showTextWordClouds: true,
        showStructuredWordClouds: false,
        cachedForms: [],
        // Graphs
        lastAnswerDate: '-',
        avgAnswersPerDay: 0,
        dateGraphData: [],
        pieChartData: [],
        multiChoiceData: [],
        numericData: [],
        textQuestionData: []
    }

    fetchFormMetadata() {
        // Get form metadata url
        let url = `${koboApi.urls().formMetadata(this.state.currentForm.formId, this.state.currentForm.token)}`

        function filterRequiredMetadata(data) {
            let columns = []
            let choicesLabels = {}
            // Get column names and format them according to data labels
            data.content.survey.forEach(col => {
                if (col.label) {
                    if (!(col.label[0].length === 0 || !col.label[0].trim())) { // Check if label is empty
                        columns.push({
                            name: col.label[0],
                            selector: col.$autoname,
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

        axios.get(url)
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
        let url = `${koboApi.urls().formSubmissions(this.state.currentForm.formId, this.state.currentForm.token)}`

        function cleanResponses(data, choicesLabels, columns) {
            // Change every value from their ID into their actual label
            data.forEach(response => {
                for (let key in response)
                    if (response.hasOwnProperty(key)) {
                        // Check if it's a numeric question or multiple choice to skip this
                        let currentCol = columns.find(q => q.selector === key)
                        let questionType = currentCol ? currentCol.type : ''
                        if (questionType !== 'integer' && questionType !== 'decimal' && questionType !== 'select_multiple') {
                            let val = response[key];
                            if (val)
                                if (choicesLabels[val]) // If the label is found, replace it with it's value
                                    response[key] = choicesLabels[val]
                        }
                    }

            })

            return data
        }

        axios.get(url)
            .then((response) => response.data.results)
            .then(data => cleanResponses(data, this.state.choicesLabels, this.state.columns))
            .then(data =>
                this.setState({
                    data: data,
                }, () => this.cacheForm()))// Cache form once the state has successfully changed
            .catch(error => this.setState({error, isLoading: false}));
    }

    updateDashboard = arg => {
        // json response data
        let cachedForm = this.getCachedForm(this.state.currentForm);
        const submissions = cachedForm.data
        const columns = cachedForm.columns
        const choicesLabels = this.state.choicesLabels

        // Filter columns from 'text' type questions
        let textQuestionColumns = columns.filter(col => col.type === 'text')
        let textQuestionData = []

        textQuestionColumns.forEach(col => {
            // Accumulate responses into a single variable for individual word cloud chart
            let accumulator = "";
            accumulator = submissions.reduce((acc, currentValue) => {
                if (currentValue.hasOwnProperty(col.selector))
                    acc += ' ' + currentValue[col.selector]
                return acc
            }, '')

            // Retrieve all answers as individual objects and filter out unanswered questions
            let data = submissions.map(submission => {
                let obj = {}
                if(submission.hasOwnProperty(col.selector)) {
                    obj.tag = submission[col.selector]
                    return obj
                }
                return undefined
            })
            data = data.filter(x => x !== undefined)
            // Count repetitions for each answer
            let counts = Utils.math().countValuesRepetitions(data, 'tag')
            // Build an object array for the structured data word cloud chart
            let weightedWords = []
            for (let key in counts) {
                let obj = {}
                obj.tag = key
                obj.weight = counts[key]
                weightedWords.push(obj)
            }

            // Exclude empty series and emails
            if (accumulator.length > 0 && weightedWords.length > 0 && !accumulator.includes('@'))
                textQuestionData.push({
                    id: col.selector,
                    name: col.name,
                    text: accumulator,
                    structuredData: weightedWords
                })
        })

        // Filter columns from 'select_one' type questions
        let pieChartColumns = columns.filter(col => col.type === 'select_one')
        let pieChartData = []

        // Count value repetitions for each question
        pieChartColumns.forEach(pieCol => {
            // Repetition counts for each question
            let counts = Utils.math().countValuesRepetitions(submissions, pieCol.selector)
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

        // Filter columns from 'select_multiple' type questions
        let multChoiceColumns = columns.filter(col => col.type === 'select_multiple')
        let multChoiceData = []

        // Count value repetitions for each question
        multChoiceColumns.forEach(col => {
            // Divide multiple answers into individual objects to replace the proper label and count them properly
            let processedAnswers = []
            let rawAnsers = submissions.map(submission => lodash.pick(submission, col.selector))
            rawAnsers.forEach(ans => {
                if (ans[col.selector]) // Replace labels on each answer
                    if (!ans[col.selector].includes(' ')) // Push individual answers
                        processedAnswers.push(ans)
                    else { // Divide multiple answers
                        let dividedAnswers = ans[col.selector].split(' ').map(ans => {return {[col.selector]: ans}})
                        processedAnswers.push(...dividedAnswers)
                    }
            })
            // Replace labels
            processedAnswers.forEach(ans => {
                if (ans.hasOwnProperty(col.selector)) {
                    let val = ans[col.selector];
                    if (val)
                        if (choicesLabels[val]) // If the label is found, replace it with it's value
                            ans[col.selector] = choicesLabels[val]
                }
            })
            // Repetition counts for each question
            let counts = Utils.math().countValuesRepetitions(processedAnswers, col.selector)
            //Create an object that will store the values
            let chartData = []
            for (let key in counts) {
                if (counts.hasOwnProperty(key)) {
                    if (key !== "undefined") {
                        chartData.push({
                            "id": key,
                            "label": key,
                            "value": counts[key]
                        })
                    }
                }
            }
            if (chartData.length > 0)
                multChoiceData.push({
                    name: col.name,
                    id: col.selector,
                    data: chartData
                })
        })


        // Filter integer and decimal columns
        let numericColumns = []
        let numericData = []
        columns.forEach(col => {
            if (col.type === 'integer' || col.type === 'decimal')
                numericColumns.push(col)
        })
        // Calculate statistics for each numeric column
        if (numericColumns.length > 0 && submissions.length > 0) {
            numericColumns.forEach(col => {
                let rawData = submissions.map(submission =>
                    submission[col.selector] ? parseFloat(submission[col.selector]) : 0)
                // Get average, min, and max
                let average = 0
                rawData.forEach(x => average += x)
                average /= rawData.length
                let min = Math.min(...rawData)
                let max = Math.max(...rawData)
                // Create data object for each question
                numericData.push({
                    name: col.name,
                    id: col.selector,
                    average: Utils.math().round(average),
                    min: min,
                    max: max
                })
            })
        }

        // Dashboard summary values

        // Submission dates
        let dates = []
        let simpleDates = []
        submissions.forEach(submission => {
            dates.push({fecha: (new Date(submission._submission_time)).toLocaleDateString()}) // Get date from timestamp
            simpleDates.push(submission._submission_time) // Get simple dates for sorting
        })

        // Build submission date data for bar graph
        let datesCounts = Utils.math().countValuesRepetitions(dates, 'fecha')
        let dateGraphData = []
        for (let key in datesCounts) {
            if (datesCounts.hasOwnProperty(key))
                dateGraphData.push({
                    fecha: key.toString(),
                    respuestas: datesCounts[key]
                })
        }

        // Average answers per day
        let avgAnswersPerDay = 0
        if (dates.length > 0)
            avgAnswersPerDay = dates.length / Object.keys(datesCounts).length

        // Last answer
        let lastAnswerDate = "N/A"
        simpleDates = simpleDates.sort() // Sort dates to get the latest one
        if (submissions.length > 0)
            lastAnswerDate = Utils.time().convertToEstTime(new Date(simpleDates[simpleDates.length-1])).toLocaleString()

        // setting state
        this.setState({
            lastAnswerDate: lastAnswerDate,
            avgAnswersPerDay: avgAnswersPerDay,
            dateGraphData: dateGraphData,
            pieChartData: pieChartData,
            multiChoiceData: multChoiceData,
            numericData: numericData,
            textQuestionData: textQuestionData,
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
            // GA Event
            ReactGA.event({
                category: 'Forms',
                action: 'Load uncached form',
                label: this.state.currentForm.name
            });
        } else{
            // GA Event
            ReactGA.event({
                category: 'Forms',
                action: 'Load cached form',
                label: this.state.currentForm.name
            });
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

    componentDidUpdate(prevProps, prevState, snapshot) {
        // Check if the logged state has changed, load forms in that case
        if (prevProps.isLoggedIn !== this.props.isLoggedIn) {
            if (this.props.isLoggedIn)
                this.loadForm()
        }
        // Update te default selected form when logging as a a new user
        if (prevProps.forms !== this.props.forms) {
            if (this.props.forms) {
                this.setState({currentForm: this.props.forms[0]}, () => this.loadForm())
            }
        }
    }

    componentDidMount() {
        // If the user is logged in already load his forms
        if (this.props.isLoggedIn)
            this.loadForm()
    }

    changeSelectedForm(form) {
        // GA Event
        ReactGA.event({
            category: 'Forms',
            action: 'Changed form',
            label: form.name
        });
        // Close modal
        this.handleCloseFormSelector.apply()
        // Change state to new selected form
        this.setState({currentForm: form, isLoading: true}, () => this.loadForm())// Reload data once state is changed
    }

    handleShowFormSelector = () => this.setState({showFormSelector: true})
    handleCloseFormSelector = () => this.setState({showFormSelector: false})

    toggleWordCloudCharts() {
        if (this.state.showTextWordClouds)
            this.setState({showTextWordClouds: false, showStructuredWordClouds: true})
        if (this.state.showStructuredWordClouds)
            this.setState({showTextWordClouds: true, showStructuredWordClouds: false})
    }

    render() {
        const {isLoading, error, currentForm, numericData, pieChartData, multiChoiceData, textQuestionData,
                showTextWordClouds, showStructuredWordClouds} = this.state

        let currentFormData = this.getCachedForm(currentForm)

        if (!currentFormData)
            currentFormData = { // Return empty object when none is found
                columns: [],
                data: [],
                formLink: "",
                id: "",
                name: ""
            }

        if (error) // Show error message
            console.log('Error message from back-end: ' + error.message)

        return (
            <div>
                {/*Display a message if we encounter an error*/}
                {error ?
                    <Modal
                        show={true}
                        size="lg"
                        onHide={() => null}
                        aria-labelledby="contained-modal-title-vcenter"
                        centered
                    >
                        <Modal.Header>
                            <Modal.Title className="text-danger">Error</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <p className="text-danger">Tenemos problemas al comunicarnos con el servidor</p>
                            <p>Es posible que se encuentre en mantenimiento</p>
                            <p>Por favor intente de nuevo mas tarde</p>
                            <p>Lamentamos los inconvenientes</p>
                        </Modal.Body>
                    </Modal>
                    : null}

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
                                            <p>{Utils.math().round(this.state.avgAnswersPerDay)}</p>
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
                                            <CustomBarChart
                                                data={this.state.dateGraphData}
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
                                                        <Dropdown.Item href={koboApi.urls().downloadSubmissions({koboUser: currentForm.koboUser, id: currentForm.formId, format: 'csv'})}>CSV</Dropdown.Item>
                                                        <Dropdown.Item href={koboApi.urls().downloadSubmissions({koboUser: currentForm.koboUser, id: currentForm.formId, format: 'xlsx'})}>XLSX</Dropdown.Item>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </div>
                                        </div>
                                        <ChartGroupTitle
                                            isShown={pieChartData.length > 0}
                                            title="Preguntas de opción múltiple"
                                        />
                                        <div className="row">
                                            {/* select_one questions */}
                                            {pieChartData.map(question => (
                                                <div className="col-lg-6 mb-4" key={question.id}>
                                                    <h5>{question.name}</h5>
                                                    <div className="chart-container">
                                                        <CustomPieChart
                                                            data={question.data}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            {/* select_multiple questions */}
                                            {multiChoiceData.map(question => (
                                                <div className="col-lg-6 mb-4" key={question.id}>
                                                    <h5>{question.name} (Selección múltiple)</h5>
                                                    <div className="chart-container">
                                                        <CustomPieChart
                                                            data={question.data}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <ChartGroupTitle
                                            isShown={numericData.length > 0}
                                            title="Preguntas numéricas"
                                        />
                                        <div className="row">
                                            {numericData.map(question => (
                                                <div className="col-lg-6 mb-4" key={question.id}>
                                                    <h5>{question.name}</h5>
                                                    <NumberStatistics
                                                        average={question.average}
                                                        min={question.min}
                                                        max={question.max}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <ChartGroupTitle
                                            isShown={true}
                                            title="Preguntas de respuesta abierta"
                                        />
                                        <div className="row pl-3 pr-3">
                                            <Button variant="info" className="ml-auto mr-auto mb-4 col-lg-6" onClick={() => this.toggleWordCloudCharts()}>
                                                {showTextWordClouds ? 'Mostrar conjuntos de palabras' : 'Mostrar palabras únicas'}
                                            </Button>
                                        </div>
                                        <div className="row">
                                            {textQuestionData.map(question => (
                                                <div className="col-lg-6 mb-4" key={question.id}>
                                                    <h5>{question.name}</h5>
                                                    {showTextWordClouds ?
                                                        <WordCloudChart
                                                            id={question.id + '-text'}
                                                            text={question.text}
                                                        />
                                                        : null}
                                                    {showStructuredWordClouds ?
                                                        <WordCloudChart
                                                            id={question.id + '-structured'}
                                                            structuredData={question.structuredData}
                                                        />
                                                        : null}
                                                </div>
                                            ))}
                                        </div>
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
                    <PlaceholderDashboard/>
                )}
            </div>
        )
    }
}

function ChartGroupTitle(props) {
    if (props.isShown)
        return (
            <div className="row">
                <div className="col-12">
                    <h3 className="data-question-title">{props.title}</h3>
                </div>
            </div>
        )
    return null
}

function PlaceholderDashboard() {
    return (
        <div className="placeholder container-fluid summary-dashboard">
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
                            <div className="parallel-card-body">
                                <div></div>
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
                            <div/>
                        </div>
                    </LoadingOverlay>
                </div>
            </div>
        </div>
    )
}

export default SummaryDashboard
